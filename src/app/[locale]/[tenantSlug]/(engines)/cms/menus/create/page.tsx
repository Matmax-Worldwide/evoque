'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { gqlRequest } from '@/lib/graphql-client';
import { ArrowLeftIcon, Loader2Icon, PlusIcon, TrashIcon } from 'lucide-react';
import { MenuItem } from '@/app/api/graphql/types';
import AuthenticationGuard from '@/components/auth/AuthenticationGuard';

interface PageBasic {
  id: string;
  title: string;
  slug: string;
}

export default function CreateMenuPageWrapper() {
  return (
    <AuthenticationGuard>
      <CreateMenuPage />
    </AuthenticationGuard>
  );
}

function CreateMenuPage() {
  const router = useRouter();
  const { locale, tenantSlug } = useParams();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [menuItems, setMenuItems] = useState<Omit<MenuItem, 'id' | 'children' | 'page'>[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<PageBasic[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);

  // Fetch available pages for menu items
  useEffect(() => {
    const fetchPages = async () => {
      setIsLoadingPages(true);
      try {
        const query = `
          query GetAllCMSPages {
            getAllCMSPages {
              id
              title
              slug
            }
          }
        `;

        const response = await gqlRequest<{ getAllCMSPages: PageBasic[] }>(query);
        if (response && response.getAllCMSPages) {
          setPages(response.getAllCMSPages);
        }
      } catch (err) {
        console.error('Error fetching pages:', err);
      } finally {
        setIsLoadingPages(false);
      }
    };

    fetchPages();
  }, []);

  const handleAddMenuItem = () => {
    setMenuItems([...menuItems, { 
      title: '', 
      url: null, 
      pageId: null, 
      target: '_self', 
      icon: null,
      order: menuItems.length + 1,
      parentId: null,
      menuId: ''
    }]);
  };

  const handleRemoveMenuItem = (index: number) => {
    const updatedItems = [...menuItems];
    updatedItems.splice(index, 1);
    // Update order for remaining items
    updatedItems.forEach((item, idx) => {
      item.order = idx + 1;
    });
    setMenuItems(updatedItems);
  };

  const handleMenuItemChange = (index: number, field: keyof Omit<MenuItem, 'id' | 'children' | 'page'>, value: string | null) => {
    const updatedItems = [...menuItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // If pageId is selected, clear URL
    if (field === 'pageId' && value) {
      updatedItems[index].url = null;
      
      // Auto-populate title if empty
      if (!updatedItems[index].title || updatedItems[index].title.trim() === '') {
        const selectedPage = pages.find(page => page.id === value);
        if (selectedPage) {
          updatedItems[index].title = selectedPage.title;
        }
      }
    }
    // If URL is entered, clear pageId
    if (field === 'url' && value) {
      updatedItems[index].pageId = null;
    }
    
    setMenuItems(updatedItems);
  };

  // Add a function to check if menu name exists
  const checkMenuNameExists = async (name: string): Promise<boolean> => {
    try {
      const query = `
        query CheckMenuExists($name: String!) {
          menuByName(name: $name) {
            id
          }
        }
      `;

      const response = await gqlRequest<{ menuByName: { id: string } | null }>(query, { name });
      return !!response.menuByName;
    } catch (err) {
      console.error('Error checking menu name:', err);
      return false;
    }
  };

  // Check for any invalid menu items to display appropriate validation indicators
  const hasFormErrors = () => {
    if (!name.trim()) return true;
    
    const hasInvalidItems = menuItems.some(item => {
      if (!item.title.trim()) return true;
      if (item.pageId === null && (!item.url || !item.url.trim())) return true;
      if (item.pageId !== null && item.pageId === '') return true;
      return false;
    });
    
    return hasInvalidItems;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Basic validation
      const hasInvalidItems = menuItems.some(item => {
        if (!item.title.trim()) return true;
        if (item.pageId === null && (!item.url || !item.url.trim())) return true;
        if (item.pageId !== null && item.pageId === '') return true;
        return false;
      });

      if (hasInvalidItems) {
        setError("Please ensure all menu items have a title and either a valid URL or selected page.");
        setIsSubmitting(false);
        return;
      }
      
      // Check if menu name already exists
      const nameExists = await checkMenuNameExists(name);
      if (nameExists) {
        setError(`A menu with the name "${name}" already exists. Please use a different name.`);
        setIsSubmitting(false);
        return;
      }

      // Step 1: Create the menu
      const createMenuMutation = `
        mutation CreateMenu($input: MenuInput!) {
          createMenu(input: $input) {
            id
            name
            location
          }
        }
      `;

      const menuVariables = {
        input: {
          name,
          location: location || null
        }
      };

      const menuResponse = await gqlRequest<{ createMenu: { id: string } }>(createMenuMutation, menuVariables);

      if (!menuResponse || !menuResponse.createMenu) {
        throw new Error('Failed to create menu');
      }

      const menuId = menuResponse.createMenu.id;

      // Step 2: Create menu items if any
      if (menuItems.length > 0) {
        const validMenuItems = menuItems.filter(item => {
          if (!item.title.trim()) return false;
          if (item.pageId === null && (!item.url || !item.url.trim())) return false;
          if (item.pageId !== null && item.pageId === '') return false;
          return true;
        });
        
        console.log('Creating menu items:', validMenuItems);
        
        for (const item of validMenuItems) {
          const createMenuItemMutation = `
            mutation CreateMenuItem($input: MenuItemInput!) {
              createMenuItem(input: $input) {
                id
                title
                url
                pageId
              }
            }
          `;

          const menuItemVariables = {
            input: {
              menuId,
              title: item.title,
              url: item.pageId ? null : item.url,  // Ensure URL is null if pageId is set
              pageId: item.pageId || null,         // Ensure pageId is null if not set
              target: item.target,
              icon: item.icon,
              parentId: null
            }
          };

          const response = await gqlRequest(createMenuItemMutation, menuItemVariables);
          console.log('Menu item created:', response);
        }
      }

      // Navigate to the edit page
      router.push(`/${locale}/${tenantSlug}/cms/menus/edit/${menuId}`);
    } catch (err) {
      console.error('Error creating menu:', err);
      if (err instanceof Error && err.message.includes('Unique constraint failed')) {
        setError(`A menu with the name "${name}" already exists. Please use a different name.`);
      } else {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Link href={`/${locale}/${tenantSlug}/cms/menus`} className="mr-4 p-2 hover:bg-gray-100 rounded-md">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Create New Menu</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Menu Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Main Navigation"
              required
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <select
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a location (optional)</option>
              <option value="HEADER">Header</option>
              <option value="FOOTER">Footer</option>
              <option value="SIDEBAR">Sidebar</option>
              <option value="MOBILE">Mobile</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Specify where this menu will be displayed on your site
            </p>
          </div>
          
          {/* Menu Items Section */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Menu Items</h3>
              <button
                type="button"
                onClick={handleAddMenuItem}
                className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Item
              </button>
            </div>
            
            {menuItems.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-md border border-dashed border-gray-300">
                <p className="text-gray-500">No menu items added yet. Click &quot;Add Item&quot; to create your first menu item.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {menuItems.map((item, index) => {
                  // Check if this item has validation errors
                  const hasError = !item.title.trim() || 
                    (item.pageId === null && (!item.url || !item.url.trim())) || 
                    (item.pageId !== null && item.pageId === '');
                    
                  return (
                    <div key={index} className={`p-4 rounded-md relative ${hasError ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                      <button
                        type="button"
                        onClick={() => handleRemoveMenuItem(index)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                        aria-label="Remove item"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                      
                      {hasError && (
                        <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">
                          <p>This menu item is incomplete. Please provide:</p>
                          <ul className="list-disc list-inside">
                            {!item.title.trim() && <li>Item title</li>}
                            {item.pageId === null && (!item.url || !item.url.trim()) && <li>URL for the link</li>}
                            {item.pageId !== null && item.pageId === '' && <li>Page selection</li>}
                          </ul>
                        </div>
                      )}
                      
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleMenuItemChange(index, 'title', e.target.value)}
                          className={`w-full p-2 border rounded-md ${!item.title.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                          placeholder="Menu Item Title"
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Link Type
                        </label>
                        <div className="grid grid-cols-1 gap-4 mb-3">
                          {/* Link Type Toggle */}
                          <div className="flex border border-gray-300 rounded-md overflow-hidden">
                            <button
                              type="button"
                              onClick={() => {
                                const updatedItems = [...menuItems];
                                updatedItems[index] = { 
                                  ...updatedItems[index], 
                                  pageId: null,
                                  url: updatedItems[index].url || '' 
                                };
                                setMenuItems(updatedItems);
                              }}
                              className={`flex-1 py-2 text-sm font-medium ${
                                item.pageId === null ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              Custom URL
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedItems = [...menuItems];
                                updatedItems[index] = { 
                                  ...updatedItems[index], 
                                  url: null,
                                  pageId: updatedItems[index].pageId || '' 
                                };
                                setMenuItems(updatedItems);
                              }}
                              className={`flex-1 py-2 text-sm font-medium ${
                                item.pageId !== null ? 'bg-green-100 text-green-800' : 'bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              Internal Page
                            </button>
                          </div>
                        </div>

                        {item.pageId === null ? (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              URL <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={item.url || ''}
                              onChange={(e) => handleMenuItemChange(index, 'url', e.target.value || null)}
                              className={`w-full p-2 border rounded-md ${
                                item.pageId === null && (!item.url || !item.url.trim()) 
                                  ? 'border-red-300 bg-red-50' 
                                  : 'border-gray-300'
                              }`}
                              placeholder="https://example.com or /page-path"
                            />
                            <p className="text-xs text-gray-500 mt-1">Enter a full URL (https://...) or a relative path (/...)</p>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Select Page <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={item.pageId || ''}
                              onChange={(e) => handleMenuItemChange(index, 'pageId', e.target.value || null)}
                              className={`w-full p-2 border rounded-md ${
                                item.pageId !== null && item.pageId === '' 
                                  ? 'border-red-300 bg-red-50' 
                                  : 'border-gray-300'
                              }`}
                            >
                              <option value="">Select a page</option>
                              {pages.map(page => (
                                <option key={page.id} value={page.id}>
                                  {page.title} ({page.slug})
                                </option>
                              ))}
                            </select>
                            {isLoadingPages && (
                              <p className="text-sm text-gray-500 mt-1 flex items-center">
                                <Loader2Icon className="h-3 w-3 animate-spin mr-1" />
                                Loading pages...
                              </p>
                            )}
                            {item.pageId && (
                              <p className="text-xs text-green-600 mt-1">
                                This menu item will link to the selected page.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Open in
                        </label>
                        <select
                          value={item.target || '_self'}
                          onChange={(e) => handleMenuItemChange(index, 'target', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <option value="_self">Same window</option>
                          <option value="_blank">New window</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Icon (optional)
                        </label>
                        <input
                          type="text"
                          value={item.icon || ''}
                          onChange={(e) => handleMenuItemChange(index, 'icon', e.target.value || null)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          placeholder="Icon name or class"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex">
          <button
            type="submit"
            disabled={isSubmitting || hasFormErrors()}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md flex items-center ${
              isSubmitting || hasFormErrors() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              'Create Menu'
            )}
          </button>
          <Link
            href={`/${locale}/${tenantSlug}/cms/menus`}
            className="ml-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
} 