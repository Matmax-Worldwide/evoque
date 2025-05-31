import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # Scalar types
  scalar DateTime
  scalar JSON

  # Enum types for Page
  enum PageType {
    CONTENT
    LANDING
    BLOG
    PRODUCT
    CATEGORY
    TAG
    HOME
    CONTACT
    ABOUT
    CUSTOM
  }

  # --------------- BOOKING MODULE ENUMS --- V1 ---
  enum DayOfWeek { MONDAY TUESDAY WEDNESDAY THURSDAY FRIDAY SATURDAY SUNDAY }
  enum ScheduleType { REGULAR_HOURS OVERRIDE_HOURS BREAK TIME_OFF SPECIAL_EVENT BLACKOUT_DATE }
  enum BookingStatus { PENDING CONFIRMED CANCELLED COMPLETED NO_SHOW RESCHEDULED }
  # --------------- END BOOKING MODULE ENUMS --- V1 ---


  enum ScrollType {
    NORMAL
    SMOOTH
  }


  # User related types
  type User {
    id: ID!
    email: String!
    firstName: String
    lastName: String
    phoneNumber: String
    profileImageUrl: String
    role: Role
    isActive: Boolean
    createdAt: String
    updatedAt: String
    notifications: [Notification!]
    settings: UserSettings
    # For Booking Module
    staffProfile: StaffProfile 
    bookings: [Booking!] 
  }

  # --------------- BOOKING MODULE TYPES (Placeholders and Full Defs) --- V1 ---
  # Placeholder for StaffLocationAssignment (if it's only a join table without extra fields, it might not need a GQL type)
  # type StaffLocationAssignment { id: ID! }
  
  type Booking {
    id: ID!
    userId: ID # ID of the registered user who booked
    user: User # Resolved from userId
    customerName: String # Name of the customer (guest or registered)
    customerEmail: String # Email of the customer
    customerPhone: String # Phone of the customer
    serviceId: ID!
    service: Service! # Resolved from serviceId
    locationId: ID!
    location: Location! # Resolved from locationId
    staffProfileId: ID # Optional: ID of the staff member
    staffProfile: StaffProfile # Resolved from staffProfileId
    bookingDate: DateTime! # Date of the appointment
    startTime: DateTime! # Start date and time of the appointment
    endTime: DateTime! # End date and time of the appointment
    status: BookingStatus!
    notes: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type StaffProfile {
    id: ID!
    userId: ID!
    user: User
    bio: String
    specializations: [String!]!
    assignedServices: [Service!]
    locationAssignments: [Location!]
    schedules: [StaffSchedule!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Service {
    id: ID!
    name: String!
    description: String
    durationMinutes: Int!
    prices: [Price!]!
    bufferTimeBeforeMinutes: Int!
    bufferTimeAfterMinutes: Int!
    preparationTimeMinutes: Int!
    cleanupTimeMinutes: Int!
    maxDailyBookingsPerService: Int
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    serviceCategoryId: ID!
    serviceCategory: ServiceCategory
    locations: [Location!]
  }

  type Price {
    id: ID!
    amount: Float!
    currencyId: String!
    currency: Currency!
    priceIncludesTax: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Currency {
    id: ID!
    code: String!
    name: String!
    symbol: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Location {
    id: ID!
    name: String!
    address: String
    phone: String
    operatingHours: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ServiceCategory {
    id: ID!
    name: String!
    description: String
    displayOrder: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
    parentId: ID
  }

  type StaffSchedule {
    id: ID!
    staffProfileId: ID!
    staffProfile: StaffProfile
    locationId: ID
    location: Location
    date: DateTime
    dayOfWeek: DayOfWeek
    startTime: String!
    endTime: String!
    scheduleType: ScheduleType!
    isAvailable: Boolean!
    notes: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type BookingRule {
    id: ID!
    advanceBookingHoursMin: Int!
    advanceBookingDaysMax: Int!
    sameDayCutoffTime: String
    bufferBetweenAppointmentsMinutes: Int!
    maxAppointmentsPerDayPerStaff: Int
    bookingSlotIntervalMinutes: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AvailableTimeSlot {
    startTime: DateTime!
    endTime: DateTime!
    isAvailable: Boolean!
    serviceId: ID!
    locationId: ID!
    staffProfileId: ID
  }


  # Role and Permission related types
  type Role {
    id: ID!
    name: String!
    description: String
    permissions: [Permission!]
    createdAt: String
    updatedAt: String
  }

  type Permission {
    id: ID!
    name: String!
    description: String
    roles: [Role!]
    createdAt: String
    updatedAt: String
  }

  type RoleWithCounts {
    id: ID!
    name: String!
    description: String
    userCount: Int
    permissionCount: Int
    createdAt: String
    updatedAt: String
  }

  # ContactFormSubmission type
  type ContactFormSubmission {
    id: ID!
    firstName: String!
    lastName: String!
    email: String!
    createdAt: String!
  }

  input ContactFormSubmissionInput {
    firstName: String!
    lastName: String!
    email: String!
  }

  # User input types for CRUD operations
  input CreateUserInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
    phoneNumber: String
    role: String!
  }

  input UpdateUserInput {
    email: String
    firstName: String
    lastName: String
    password: String
    phoneNumber: String
    role: String
    roleId: ID
    isActive: Boolean
  }

  input ProfileUpdateInput {
    firstName: String
    lastName: String
    email: String
    phoneNumber: String
    currentPassword: String
    newPassword: String
  }

  input UpdateUserProfileInput {
    firstName: String
    lastName: String
    phoneNumber: String
    bio: String
    position: String
    department: String
  }

  # Document related types
  type Document {
    id: ID!
    title: String!
    description: String
    status: DocumentStatus!
    fileUrl: String
    createdAt: String!
    updatedAt: String!
    userId: ID!
    user: User
  }

  enum DocumentStatus {
    DRAFT
    PENDING_REVIEW
    APPROVED
    REJECTED
  }

  type DocumentStatusCount {
    status: String!
    count: Int!
  }

  input CreateDocumentInput {
    title: String!
    description: String
    fileUrl: String
    status: DocumentStatus
  }

  input UpdateDocumentInput {
    title: String
    description: String
    fileUrl: String
    status: DocumentStatus
  }

  # Time entry related types
  type TimeEntry {
    id: ID!
    date: String!
    hours: Float!
    description: String!
    projectId: ID
    project: Project
    userId: ID!
    user: User
    createdAt: String!
    updatedAt: String!
  }

  type DailyTimeEntry {
    day: String!
    hours: Float!
  }

  input CreateTimeEntryInput {
    date: String!
    hours: Float!
    description: String!
    projectId: ID
  }

  input UpdateTimeEntryInput {
    date: String
    hours: Float
    description: String
    projectId: ID
  }

  # Project related types
  type Project {
    id: ID!
    name: String!
    description: String
    status: ProjectStatus!
    clientId: ID
    client: Client
    createdAt: String!
    updatedAt: String!
  }

  enum ProjectStatus {
    ACTIVE
    COMPLETED
    ON_HOLD
  }

  input CreateProjectInput {
    name: String!
    description: String
    status: ProjectStatus
    clientId: ID
  }

  input UpdateProjectInput {
    name: String
    description: String
    status: ProjectStatus
    clientId: ID
  }

  # Client related types
  type Client {
    id: ID!
    name: String!
    email: String
    phone: String
    address: String
    createdAt: String!
    updatedAt: String!
  }

  # Appointment related types
  type Appointment {
    id: ID!
    title: String!
    description: String
    startTime: String!
    endTime: String!
    location: String
    isVirtual: Boolean
    meetingUrl: String
    userId: ID!
    user: User
    clientId: ID
    client: Client
    createdAt: String!
    updatedAt: String!
  }

  input CreateAppointmentInput {
    title: String!
    description: String
    startTime: String!
    endTime: String!
    location: String
    isVirtual: Boolean
    meetingUrl: String
    clientId: ID
  }

  input UpdateAppointmentInput {
    title: String
    description: String
    startTime: String
    endTime: String
    location: String
    isVirtual: Boolean
    meetingUrl: String
    clientId: ID
  }

  # Task related types
  type Task {
    id: ID!
    title: String!
    description: String
    dueDate: String
    status: TaskStatus!
    userId: ID!
    user: User
    projectId: ID
    project: Project
    createdAt: String!
    updatedAt: String!
  }

  enum TaskStatus {
    NOT_STARTED
    IN_PROGRESS
    COMPLETED
    CANCELLED
  }

  type TaskStatusCount {
    status: String!
    count: Int!
  }

  input CreateTaskInput {
    title: String!
    description: String
    dueDate: String
    status: TaskStatus
    projectId: ID
  }

  input UpdateTaskInput {
    title: String
    description: String
    dueDate: String
    status: TaskStatus
    projectId: ID
  }

  # Performance types
  type Performance {
    id: ID!
    userId: ID!
    user: User
    period: String!
    completedTasks: Int!
    totalHours: Float!
    efficiency: Float
    notes: String
    createdAt: String!
    updatedAt: String!
  }

  input CreatePerformanceInput {
    period: String!
    completedTasks: Int!
    totalHours: Float!
    efficiency: Float
    notes: String
  }

  input UpdatePerformanceInput {
    period: String
    completedTasks: Int
    totalHours: Float
    efficiency: Float
    notes: String
  }

  # Notification types
  type Notification {
    id: ID!
    userId: ID!
    user: User
    type: String!
    title: String!
    message: String!
    isRead: Boolean!
    relatedItemId: String
    relatedItemType: String
    createdAt: String!
    updatedAt: String!
  }

  enum NotificationType {
    DOCUMENT
    TASK
    APPOINTMENT
    SYSTEM
  }

  input CreateNotificationInput {
    userId: ID!
    type: String!
    title: String!
    message: String!
    relatedItemId: String
    relatedItemType: String
  }

  input UpdateNotificationInput {
    isRead: Boolean
  }

  # Settings types
  type UserSettings {
    id: ID!
    userId: ID! # Assuming this maps to the User ID
    user: User # Relation to User
    emailNotifications: Boolean!
    theme: String!
    language: String!
    timeFormat: String!
    dateFormat: String!
    createdAt: String! # Using String for DateTime as per existing pattern
    updatedAt: String! # Using String for DateTime
  }

  input UpdateUserSettingsInput {
    emailNotifications: Boolean
    theme: String
    language: String
    timeFormat: String
    dateFormat: String
  }

  type SiteSettings {
    id: ID!
    siteName: String!
    siteDescription: String
    logoUrl: String
    faviconUrl: String
    primaryColor: String
    secondaryColor: String
    googleAnalyticsId: String
    facebookPixelId: String
    customCss: String
    customJs: String
    contactEmail: String
    contactPhone: String
    address: String
    accentColor: String
    defaultLocale: String!
    footerText: String
    maintenanceMode: Boolean!
    metaDescription: String
    metaTitle: String
    ogImage: String
    socialLinks: String # Using String for JSON as per existing pattern (JSON scalar exists but example uses String)
    supportedLocales: [String!]!
    twitterCardType: String
    twitterHandle: String
    createdAt: String! # Using String for DateTime
    updatedAt: String! # Using String for DateTime
  }

  input UpdateSiteSettingsInput {
    siteName: String
    siteDescription: String
    logoUrl: String
    faviconUrl: String
    primaryColor: String
    secondaryColor: String
    googleAnalyticsId: String
    facebookPixelId: String
    customCss: String
    customJs: String
    contactEmail: String
    contactPhone: String
    address: String
    accentColor: String
    defaultLocale: String
    footerText: String
    maintenanceMode: Boolean
    metaDescription: String
    metaTitle: String
    ogImage: String
    socialLinks: String # Input for JSON field
    supportedLocales: [String!]
    twitterCardType: String
    twitterHandle: String
  }

  # Help types
  type HelpArticle {
    id: ID!
    title: String!
    content: String!
    category: String!
    tags: [String!]
    createdAt: String!
    updatedAt: String!
  }

  input CreateHelpArticleInput {
    title: String!
    content: String!
    category: String!
    tags: [String!]
  }

  input UpdateHelpArticleInput {
    title: String
    content: String
    category: String
    tags: [String!]
  }

  # External Link types
  type ExternalLink {
    id: ID!
    name: String!
    url: String!
    icon: String
    description: String
    isActive: Boolean!
    order: Int
    createdAt: String
    updatedAt: String
    createdBy: ID
    accessType: AccessControlType!
    allowedRoles: [String]
    allowedUsers: [ID]
    deniedUsers: [ID]
  }

  enum AccessControlType {
    PUBLIC
    ROLES
    USERS
    MIXED
  }

  type AccessControl {
    type: AccessControlType!
    allowedRoles: [String]
    allowedUsers: [ID]
    deniedUsers: [ID]
  }

  type LinkAccessStatus {
    linkId: ID!
    linkName: String!
    hasAccess: Boolean!
    accessType: AccessControlType
    isInAllowedRoles: Boolean
    isInAllowedUsers: Boolean
    isInDeniedUsers: Boolean
  }

  input AccessControlInput {
    type: AccessControlType!
    allowedRoles: [String]
    allowedUsers: [ID]
    deniedUsers: [ID]
  }

  input ExternalLinkInput {
    name: String!
    url: String!
    icon: String
    description: String
    isActive: Boolean
    order: Int
    accessControl: AccessControlInput
  }

  input CreateExternalLinkInput {
    name: String!
    url: String!
    icon: String!
    description: String
    isActive: Boolean
    order: Int
  }

  input UpdateExternalLinkInput {
    name: String
    url: String
    icon: String
    description: String
    isActive: Boolean
    order: Int
  }

  # Dashboard stats type
  type DashboardStats {
    totalDocuments: Int!
    documentsThisMonth: Int!
    totalAppointments: Int!
    appointmentsThisWeek: Int!
    completedTasks: Int!
    pendingTasks: Int!
    totalHoursLogged: Float!
    hoursLoggedThisWeek: Float!
  }

  # Auth type
  type AuthPayload {
    token: String!
    user: User!
  }

  # Role and Permission input types
  input RoleCreateInput {
    name: String!
    description: String
  }

  input PermissionInput {
    name: String!
    description: String
    roleId: ID
  }

  # Permisos específicos de usuario
  type UserPermission {
    id: ID!
    userId: String!
    permissionName: String!
    granted: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input UserPermissionInput {
    userId: ID!
    permissionName: String!
    granted: Boolean
  }

  # CMS Section types
  type SectionData {
    components: [Component!]!
    lastUpdated: String
  }
  
  type Component {
    id: ID!
    type: String!
    data: JSON!
  }
  
  type SaveSectionResult {
    success: Boolean!
    message: String
    lastUpdated: String
  }
  
  # Definición del tipo CMSSection para respuestas
  type CMSSection {
    id: ID!
    sectionId: String!
    name: String
    description: String
    backgroundImage: String
    backgroundType: String
    lastUpdated: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
    createdBy: String
    components: [SectionComponent!]
    order: Int
  }

  # Definición del componente de sección
  type SectionComponent {
    id: ID!
    sectionId: String!
    componentId: String!
    order: Int!
    data: JSON
    component: CMSComponent
  }

  # Definición del tipo de componente
  type CMSComponent {
    id: ID!
    name: String!
    slug: String!
    description: String
    category: String
    icon: String
    schema: JSON
    isActive: Boolean
    createdAt: DateTime
    updatedAt: DateTime
  }
  
  # Full Page type
  type Page {
    id: ID!
    title: String!
    slug: String!
    description: String
    template: String
    isPublished: Boolean!
    publishDate: DateTime
    featuredImage: String
    metaTitle: String
    metaDescription: String
    parentId: String
    order: Int
    pageType: PageType!
    locale: String
    scrollType: ScrollType
    isDefault: Boolean
    createdAt: DateTime!
    updatedAt: DateTime!
    sections: [CMSSection!]
    seo: PageSEO
    parent: Page
    children: [Page!]
  }

  # PageSEO type 
  type PageSEO {
    id: ID!
    pageId: ID!
    title: String
    description: String
    keywords: String
    ogTitle: String
    ogDescription: String
    ogImage: String
    twitterTitle: String
    twitterDescription: String
    twitterImage: String
    canonicalUrl: String
    structuredData: JSON
    createdAt: DateTime
    updatedAt: DateTime
  }

  # Input for creating pages
  input CreatePageInput {
    title: String!
    slug: String!
    description: String
    template: String
    isPublished: Boolean
    publishDate: DateTime
    featuredImage: String
    metaTitle: String
    metaDescription: String
    parentId: String
    order: Int
    pageType: PageType
    locale: String
    scrollType: ScrollType
    isDefault: Boolean
    seo: PageSEOInput
    sections: [ID!]
  }
  
  # Page result type
  type PageResult {
    success: Boolean!
    message: String!
    page: Page
  }

  # Menu types
  type Menu {
    id: ID!
    name: String!
    location: String
    createdAt: DateTime!
    updatedAt: DateTime!
    items: [MenuItem!]
    headerStyle: HeaderStyle
    footerStyle: FooterStyle
  }

  input MenuInput {
    name: String!
    location: String
    headerStyle: HeaderStyleInput
    footerStyle: FooterStyleInput
  }

  type MenuItem {
    id: ID!
    menuId: String!
    parentId: String
    title: String!
    url: String
    pageId: String
    target: String
    icon: String
    order: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
    children: [MenuItem!]
    parent: MenuItem
    menu: Menu
    page: PageBasic
  }

  # Basic page type for use in menu items
  type PageBasic {
    id: ID!
    title: String!
    slug: String!
  }

  input MenuItemInput {
    menuId: String!
    parentId: String
    title: String!
    url: String
    pageId: String
    target: String
    icon: String
  }

  input MenuItemOrderInput {
    newOrder: Int!
  }

  input MenuItemOrderUpdate {
    id: ID!
    order: Int!
    parentId: String
  }

  # Resultado de operaciones con componentes
  type CMSComponentResult {
    success: Boolean!
    message: String
    component: CMSComponent
  }
  
  input ComponentInput {
    id: ID!
    type: String!
    data: JSON!
  }
  
  input SaveSectionInput {
    sectionId: ID!
    components: [ComponentInput!]!
  }

  # Input para crear un componente CMS
  input CreateCMSComponentInput {
    name: String!
    slug: String!
    description: String
    category: String
    schema: JSON
    icon: String
  }

  # Input para actualizar un componente CMS
  input UpdateCMSComponentInput {
    name: String
    description: String
    category: String
    schema: JSON
    icon: String
    isActive: Boolean
  }

  # Input para actualizar una sección CMS
  input UpdateCMSSectionInput {
    name: String
    description: String
    backgroundImage: String
    backgroundType: String
    gridDesign: String
  }

  # Input for creating a CMS section
  input CreateCMSSectionInput {
    sectionId: String!
    name: String!
    description: String
    backgroundImage: String
    backgroundType: String
    gridDesign: String
  }

  # Result type for CMS section operations
  type CMSSectionResult {
    success: Boolean!
    message: String!
    section: CMSSection
  }


  # Input for updating pages
  input UpdatePageInput {
    title: String
    slug: String
    description: String
    template: String
    isPublished: Boolean
    publishDate: DateTime
    featuredImage: String
    metaTitle: String
    metaDescription: String
    parentId: String
    order: Int
    pageType: String
    locale: String
    scrollType: String
    isDefault: Boolean
    seo: PageSEOInput
    sections: [ID!]
  }

  input PageSEOInput {
    title: String
    description: String
    keywords: String
    ogTitle: String
    ogDescription: String
    ogImage: String
    twitterTitle: String
    twitterDescription: String
    twitterImage: String
    canonicalUrl: String
    structuredData: JSON
  }

  type PageMutationResponse {
    success: Boolean!
    message: String!
    page: Page
  }

  # Form Builder types
  enum FormFieldType {
    TEXT
    TEXTAREA
    EMAIL
    PASSWORD
    NUMBER
    PHONE
    DATE
    TIME
    DATETIME
    SELECT
    MULTISELECT
    RADIO
    CHECKBOX
    TOGGLE
    SLIDER
    RATING
    FILE
    HIDDEN
    HEADING
    PARAGRAPH
    DIVIDER
    SPACER
    HTML
    CAPTCHA
    SIGNATURE
    AUTOCOMPLETE
    ADDRESS
  }

  enum SubmissionStatus {
    RECEIVED
    PROCESSING
    COMPLETED
    REJECTED
    SPAM
  }

  type Form {
    id: ID!
    title: String!
    description: String
    slug: String!
    isMultiStep: Boolean!
    isActive: Boolean!
    successMessage: String
    redirectUrl: String
    submitButtonText: String!
    submitButtonStyle: String
    layout: String
    styling: JSON
    pageId: String
    createdById: String!
    updatedById: String
    createdAt: DateTime!
    updatedAt: DateTime!
    fields: [FormField!]
    steps: [FormStep!]
    submissions: [FormSubmission!]
    page: Page
  }

  type FormStep {
    id: ID!
    formId: String!
    title: String!
    description: String
    order: Int!
    isVisible: Boolean!
    validationRules: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
    form: Form!
    fields: [FormField!]
  }

  type FormField {
    id: ID!
    formId: String
    stepId: String
    label: String!
    name: String!
    type: FormFieldType!
    placeholder: String
    defaultValue: String
    helpText: String
    isRequired: Boolean!
    order: Int!
    options: JSON
    validationRules: JSON
    styling: JSON
    width: Int
    createdAt: DateTime!
    updatedAt: DateTime!
    form: Form
    step: FormStep
  }

  type FormSubmission {
    id: ID!
    formId: String!
    data: JSON!
    metadata: JSON
    status: SubmissionStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
    form: Form!
  }

  # Form Builder input types
  input FormInput {
    title: String!
    description: String
    slug: String!
    isMultiStep: Boolean
    isActive: Boolean
    successMessage: String
    redirectUrl: String
    submitButtonText: String
    submitButtonStyle: String
    layout: String
    styling: JSON
    pageId: String
  }

  input FormStepInput {
    formId: String!
    title: String!
    description: String
    order: Int
    isVisible: Boolean
    validationRules: JSON
  }

  input FormFieldInput {
    formId: String
    stepId: String
    label: String!
    name: String!
    type: FormFieldType!
    placeholder: String
    defaultValue: String
    helpText: String
    isRequired: Boolean
    order: Int
    options: JSON
    validationRules: JSON
    styling: JSON
    width: Int
  }

  input FormSubmissionInput {
    formId: String!
    data: JSON!
    metadata: JSON
  }

  input UpdateFormInput {
    title: String
    description: String
    slug: String
    isMultiStep: Boolean
    isActive: Boolean
    successMessage: String
    redirectUrl: String
    submitButtonText: String
    submitButtonStyle: String
    layout: String
    styling: JSON
    pageId: String
  }

  input UpdateFormStepInput {
    title: String
    description: String
    order: Int
    isVisible: Boolean
    validationRules: JSON
  }

  input UpdateFormFieldInput {
    formId: String
    stepId: String
    label: String
    name: String
    type: FormFieldType
    placeholder: String
    defaultValue: String
    helpText: String
    isRequired: Boolean
    order: Int
    options: JSON
    validationRules: JSON
    styling: JSON
    width: Int
  }

  type FormResult {
    success: Boolean!
    message: String
    form: Form
  }

  type FormStepResult {
    success: Boolean!
    message: String
    step: FormStep
  }

  type FormFieldResult {
    success: Boolean!
    message: String
    field: FormField
  }

  type FormSubmissionResult {
    success: Boolean!
    message: String
    submission: FormSubmission
  }

  type FormFieldOrderResult {
    success: Boolean!
    message: String
  }

  input FieldOrderUpdate {
    id: ID!
    order: Int!
  }

  # Root Query
  type Query {
    # User queries
    me: User
    user(id: ID!): User
    users: [User!]

    # Role and permission queries
    roles: [Role]
    role(id: ID!): Role
    rolesWithCounts: [RoleWithCounts]
    permissions: [Permission]
    rolePermissions(roleId: ID!): [Permission]
    
    # Permission queries - public access
    allPermissions: [Permission!]!
    allUsersWithPermissions: [User!]!
    
    # Contact form queries
    contactFormSubmissions: [ContactFormSubmission!]
    
    # Dashboard queries
    dashboardStats: DashboardStats
    documentsByStatus: [DocumentStatusCount!]
    timeEntriesByDay: [DailyTimeEntry!]
    tasksByStatus: [TaskStatusCount!]
    
    # Document queries
    documents: [Document!]
    document(id: ID!): Document
    documentStatusCounts: [DocumentStatusCount!]
    
    # Time entry queries
    timeEntries: [TimeEntry!]
    timeEntry(id: ID!): TimeEntry
    
    # Appointment queries
    appointments: [Appointment!]
    appointment(id: ID!): Appointment
    upcomingAppointments(count: Int): [Appointment!]
    
    # Task queries
    tasks: [Task!]
    task(id: ID!): Task
    
    # Project queries
    projects: [Project!]
    project(id: ID!): Project
    
    # Client queries
    clients: [Client!]
    client(id: ID!): Client

    # Performance queries
    performances: [Performance!]
    performance(id: ID!): Performance
    currentPerformance: Performance
    
    # Notification queries
    notifications: [Notification!]
    notification(id: ID!): Notification
    unreadNotificationsCount: Int
    allNotifications: [Notification!]
    
    # Settings queries
    userSettings: UserSettings
    getSiteSettings: SiteSettings
    
    # Help queries
    helpArticles: [HelpArticle!]
    helpArticle(id: ID!): HelpArticle
    helpArticlesByCategory(category: String!): [HelpArticle!]
    searchHelpArticles(query: String!): [HelpArticle!]

    # External Link queries
    externalLinks: [ExternalLink]
    externalLink(id: ID!): ExternalLink
    activeExternalLinks: [ExternalLink]
    activeExternalLinksAs(roleId: String!): [ExternalLink]
    userLinkAccessStatus: [LinkAccessStatus]

    # Permisos específicos de usuario
    userSpecificPermissions(userId: ID!): [UserPermission!]!

    # CMS Queries
    getSectionComponents(sectionId: ID!): SectionData
    getAllCMSSections: [CMSSection!]!
    
    # Nuevas queries para componentes CMS
    getAllCMSComponents: [CMSComponent!]!
    getCMSComponent(id: ID!): CMSComponent
    getCMSComponentsByType(type: String!): [CMSComponent!]!
    
    # Nuevas queries para páginas CMS
    getAllCMSPages: [Page!]!
    page(id: ID!): Page
    getPageBySlug(slug: String!): Page
    getDefaultPage(locale: String!): Page
    getPagesUsingSectionId(sectionId: ID!): [Page!]!

    # Menu queries
    menus: [Menu!]!
    menu(id: ID!): Menu
    menuByName(name: String!): Menu
    menuByLocation(location: String!): Menu
    pages: [PageBasic!]! # New query to get pages for menu items

    # Form Builder queries
    forms: [Form!]!
    form(id: ID!): Form
    formBySlug(slug: String!): Form
    formSteps(formId: ID!): [FormStep!]!
    formStep(id: ID!): FormStep
    formFields(formId: ID!, stepId: ID): [FormField!]!
    formField(id: ID!): FormField
    formSubmissions(formId: ID!, limit: Int, offset: Int): [FormSubmission!]!
    formSubmission(id: ID!): FormSubmission
    formSubmissionStats(formId: ID!): JSON

    # Blog queries
    blogs: [Blog!]!
    blog(id: ID!): Blog
    blogBySlug(slug: String!): Blog
    post(id: ID!): Post
    posts(filter: PostFilter): [Post!]!
    postBySlug(slug: String!): Post

    # Media queries
    media: [Media!]!
    mediaItem(id: ID!): Media
    mediaByType(fileType: String!): [Media!]!
    mediaInFolder(folder: String): [Media!]!

    # Calendar/Booking queries
    location(id: ID!): Location
    locations: [Location!]!
    serviceCategory(id: ID!): ServiceCategory
    serviceCategories: [ServiceCategory!]!
    service(id: ID!): Service
    services: [Service!]!
    staffProfile(id: ID!): StaffProfile
    staffProfiles: [StaffProfile!]!
    bookings(filter: BookingFilterInput, pagination: PaginationInput): BookingConnection!
    globalBookingRule: BookingRule
    availableSlots(serviceId: ID!, locationId: ID!, staffProfileId: ID, date: String!): [AvailableTimeSlot!]!
    staffForService(serviceId: ID!, locationId: ID): [StaffProfile!]!

    # E-commerce queries
    shops(filter: ShopFilterInput, pagination: PaginationInput): [Shop!]!
    shop(id: ID!): Shop
    products(filter: ProductFilterInput, pagination: PaginationInput): [Product!]!
    product(id: ID!): Product
    productBySku(sku: String!): Product
    productCategories(filter: ProductCategoryFilterInput, pagination: PaginationInput): [ProductCategory!]!
    productCategory(id: ID!): ProductCategory
    productCategoryBySlug(slug: String!): ProductCategory
    orders(filter: OrderFilterInput, pagination: PaginationInput): [Order!]!
    order(id: ID!): Order
    currencies: [Currency!]!
    currency(id: ID!): Currency
    currencyByCode(code: String!): Currency
    taxes(shopId: String): [Tax!]!
    tax(id: ID!): Tax
    
    # Payment queries
    paymentProviders(filter: PaymentProviderFilterInput, pagination: PaginationInput): [PaymentProvider!]!
    paymentProvider(id: ID!): PaymentProvider
    paymentMethods(filter: PaymentMethodFilterInput, pagination: PaginationInput): [PaymentMethod!]!
    paymentMethod(id: ID!): PaymentMethod
    payments(filter: PaymentFilterInput, pagination: PaginationInput): [Payment!]!
    payment(id: ID!): Payment
    
    # Shipping queries
    shippingProviders(filter: ShippingProviderFilterInput, pagination: PaginationInput): [ShippingProvider!]!
    shippingProvider(id: ID!): ShippingProvider
    shippingMethods(filter: ShippingMethodFilterInput, pagination: PaginationInput): [ShippingMethod!]!
    shippingMethod(id: ID!): ShippingMethod
    shippingZones(filter: ShippingZoneFilterInput, pagination: PaginationInput): [ShippingZone!]!
    shippingZone(id: ID!): ShippingZone
    shippingRates(filter: ShippingRateFilterInput, pagination: PaginationInput): [ShippingRate!]!
    shippingRate(id: ID!): ShippingRate
    shipments(filter: ShipmentFilterInput, pagination: PaginationInput): [Shipment!]!
    shipment(id: ID!): Shipment
    
    # Review queries
    reviews(filter: ReviewFilterInput, pagination: PaginationInput): [Review!]!
    review(id: ID!): Review
    reviewsByProduct(productId: ID!, filter: ReviewFilterInput, pagination: PaginationInput): [Review!]!
    reviewsByCustomer(customerId: ID!, filter: ReviewFilterInput, pagination: PaginationInput): [Review!]!
    reviewStats(productId: ID): ReviewStats!
    pendingReviews(pagination: PaginationInput): [Review!]!
    
    # Customer queries
    customers(filter: CustomerFilterInput, pagination: PaginationInput): [Customer!]!
    customer(id: ID!): Customer
    customerByEmail(email: String!): Customer
    customerStats: CustomerStats!
    
    # Discount queries
    discounts(filter: DiscountFilterInput, pagination: PaginationInput): [Discount!]!
    discount(id: ID!): Discount
    discountByCode(code: String!): Discount
    validateDiscount(code: String!, orderTotal: Float!, customerId: ID): DiscountValidation!
    
    # Digital Signage queries
    getDevice(id: ID!): Device
    listDevices(organizationId: ID!): [Device!]!
    getSignageMedia(id: ID!, organizationId: ID!): SignageMedia
    listSignageMedia(organizationId: ID!): [SignageMedia!]!
    getPlaylist(id: ID!, organizationId: ID!): Playlist
    listPlaylists(organizationId: ID!): [Playlist!]!
    getPlaylistForDevice(deviceId: ID!): Playlist
  }

  # Root Mutation
  type Mutation {
    # Auth mutations
    login(email: String!, password: String!): AuthPayload!
    register(email: String!, password: String!, firstName: String!, lastName: String!, phoneNumber: String): AuthPayload!
    
    # Contact form mutation
    createContactFormSubmission(input: ContactFormSubmissionInput!): ContactFormSubmission!
    
    # User mutations
    createUser(input: CreateUserInput!): User
    updateUser(id: ID!, input: UpdateUserInput!): User
    deleteUser(id: ID!): Boolean
    updateUserProfile(input: UpdateUserProfileInput!): User
    
    # Document mutations
    createDocument(input: CreateDocumentInput!): Document!
    updateDocument(id: ID!, input: UpdateDocumentInput!): Document!
    deleteDocument(id: ID!): Boolean!
    
    # Time entry mutations
    createTimeEntry(input: CreateTimeEntryInput!): TimeEntry!
    updateTimeEntry(id: ID!, input: UpdateTimeEntryInput!): TimeEntry!
    deleteTimeEntry(id: ID!): Boolean!
    
    # Appointment mutations
    createAppointment(input: CreateAppointmentInput!): Appointment!
    updateAppointment(id: ID!, input: UpdateAppointmentInput!): Appointment!
    deleteAppointment(id: ID!): Boolean!
    
    # Task mutations
    createTask(input: CreateTaskInput!): Task!
    updateTask(id: ID!, input: UpdateTaskInput!): Task!
    deleteTask(id: ID!): Boolean!
    
    # Project mutations
    createProject(input: CreateProjectInput!): Project!
    updateProject(id: ID!, input: UpdateProjectInput!): Project!
    deleteProject(id: ID!): Boolean!

    # Performance mutations
    createPerformance(input: CreatePerformanceInput!): Performance!
    updatePerformance(id: ID!, input: UpdatePerformanceInput!): Performance!
    deletePerformance(id: ID!): Boolean!
    
    # Notification mutations
    createNotification(input: CreateNotificationInput!): Notification!
    updateNotification(id: ID!, input: UpdateNotificationInput!): Notification!
    markAllNotificationsAsRead: Boolean
    deleteNotification(id: ID!): Boolean
    deleteMultipleNotifications(ids: [ID!]!): Int
    
    # Settings mutations
    updateUserSettings(input: UpdateUserSettingsInput!): UserSettings!
    updateSiteSettings(input: UpdateSiteSettingsInput!): SiteSettings
    
    # Help mutations
    createHelpArticle(input: CreateHelpArticleInput!): HelpArticle!
    updateHelpArticle(id: ID!, input: UpdateHelpArticleInput!): HelpArticle!
    deleteHelpArticle(id: ID!): Boolean!

    # External Link mutations
    createExternalLink(input: ExternalLinkInput!): ExternalLink
    updateExternalLink(id: ID!, input: ExternalLinkInput!): ExternalLink
    deleteExternalLink(id: ID!): Boolean
    updateLinkAccess(id: ID!, accessControl: AccessControlInput!): ExternalLink
    
    # Role and permission mutations
    createRole(input: RoleCreateInput!): Role
    updateRole(id: ID!, input: RoleCreateInput!): Role
    deleteRole(id: ID!): Boolean
    createPermission(input: PermissionInput!): Permission
    assignPermissionToRole(roleId: ID!, permissionId: ID!): Permission
    removePermissionFromRole(roleId: ID!, permissionId: ID!): Boolean

    # Gestionar permisos específicos de usuario
    setUserPermission(input: UserPermissionInput!): UserPermission!

    # CMS Mutations
    saveSectionComponents(input: SaveSectionInput!): SaveSectionResult
    deleteCMSSection(sectionId: ID!): SaveSectionResult
    updateCMSSection(sectionId: ID!, input: UpdateCMSSectionInput!): SaveSectionResult
    
    # Nuevas mutations para componentes CMS
    createCMSComponent(input: CreateCMSComponentInput!): CMSComponentResult
    updateCMSComponent(id: ID!, input: UpdateCMSComponentInput!): CMSComponentResult
    deleteCMSComponent(id: ID!): SaveSectionResult
    
    # Page mutations
    createPage(input: CreatePageInput!): PageResult
    updatePage(id: ID!, input: UpdatePageInput!): PageResult
    deletePage(id: ID!): PageResult
    
    # Section mutations
    createCMSSection(input: CreateCMSSectionInput!): CMSSectionResult
    associateSectionToPage(pageId: ID!, sectionId: ID!, order: Int!): PageResult
    dissociateSectionFromPage(pageId: ID!, sectionId: ID!): PageResult

    # Menu mutations
    createMenu(input: MenuInput!): Menu
    updateMenu(id: ID!, input: MenuInput!): Menu
    deleteMenu(id: ID!): Boolean
    
    # MenuItem mutations
    createMenuItem(input: MenuItemInput!): MenuItem
    updateMenuItem(id: ID!, input: MenuItemInput!): MenuItem
    deleteMenuItem(id: ID!): Boolean
    updateMenuItemOrder(id: ID!, input: MenuItemOrderInput!): MenuItem
    updateMenuItemsOrder(items: [MenuItemOrderUpdate!]!): Boolean

    # HeaderStyle mutations
    updateHeaderStyle(menuId: ID!, input: HeaderStyleInput!): HeaderStyleResult!

    # FooterStyle mutations
    updateFooterStyle(menuId: ID!, input: FooterStyleInput!): FooterStyleResult!

    # Form Builder mutations
    createForm(input: FormInput!): FormResult!
    updateForm(id: ID!, input: UpdateFormInput!): FormResult!
    deleteForm(id: ID!): FormResult!
    
    createFormStep(input: FormStepInput!): FormStepResult!
    updateFormStep(id: ID!, input: UpdateFormStepInput!): FormStepResult!
    deleteFormStep(id: ID!): FormStepResult!
    
    createFormField(input: FormFieldInput!): FormFieldResult!
    updateFormField(id: ID!, input: UpdateFormFieldInput!): FormFieldResult!
    deleteFormField(id: ID!): FormFieldResult!
    updateFieldOrders(updates: [FieldOrderUpdate!]!): FormFieldOrderResult!
    
    submitForm(input: FormSubmissionInput!): FormSubmissionResult!
    updateFormSubmissionStatus(id: ID!, status: SubmissionStatus!): FormSubmissionResult!
    deleteFormSubmission(id: ID!): FormSubmissionResult!

    # Blog mutations
    createBlog(input: BlogInput!): BlogResult!
    updateBlog(id: ID!, input: BlogInput!): BlogResult!
    deleteBlog(id: ID!): BlogResult!
    
    createPost(input: CreatePostInput!): PostResult!
    updatePost(id: ID!, input: UpdatePostInput!): PostResult!
    deletePost(id: ID!): PostResult!

    # Media mutations
    createMedia(input: CreateMediaInput!): MediaResult!
    updateMedia(id: ID!, input: UpdateMediaInput!): MediaResult!
    deleteMedia(id: ID!): MediaResult!
    associateMediaToPost(postId: ID!, mediaId: ID!): PostResult!
    dissociateMediaFromPost(postId: ID!, mediaId: ID!): PostResult!

    # Calendar/Booking mutations
    createBooking(input: CreateBookingInput!): BookingResult!
    updateBooking(id: ID!, input: UpdateBookingInput!): BookingResult!
    deleteBooking(id: ID!): BookingResult!
    
    createStaffProfile(input: CreateStaffProfileInput!): StaffProfileResult!
    updateStaffProfile(id: ID!, input: UpdateStaffProfileInput!): StaffProfileResult!
    deleteStaffProfile(id: ID!): StaffProfileResult!
    updateStaffSchedule(staffProfileId: ID!, schedule: [StaffScheduleInput!]!): StaffProfileResult!
    
    createService(input: CreateServiceInput!): ServiceResult!
    updateService(id: ID!, input: UpdateServiceInput!): ServiceResult!
    deleteService(id: ID!): ServiceResult!
    
    createLocation(input: CreateLocationInput!): LocationResult!
    updateLocation(id: ID!, input: UpdateLocationInput!): LocationResult!
    deleteLocation(id: ID!): LocationResult!
    
    createServiceCategory(input: CreateServiceCategoryInput!): ServiceCategoryResult!
    updateServiceCategory(id: ID!, input: UpdateServiceCategoryInput!): ServiceCategoryResult!
    deleteServiceCategory(id: ID!): ServiceCategoryResult!
    
    upsertGlobalBookingRules(input: BookingRuleInput!): BookingRule!
    updateGlobalBookingRules(input: GlobalBookingRuleInput!): BookingRule!

    # E-commerce mutations
    createShop(input: CreateShopInput!): ShopResult!
    updateShop(id: ID!, input: UpdateShopInput!): ShopResult!
    deleteShop(id: ID!): ShopResult!
    
    createProduct(input: CreateProductInput!): ProductResult!
    updateProduct(id: ID!, input: UpdateProductInput!): ProductResult!
    deleteProduct(id: ID!): ProductResult!
    
    createProductCategory(input: CreateProductCategoryInput!): ProductCategoryResult!
    updateProductCategory(id: ID!, input: UpdateProductCategoryInput!): ProductCategoryResult!
    deleteProductCategory(id: ID!): ProductCategoryResult!
    
    createOrder(input: CreateOrderInput!): OrderResult!
    updateOrder(id: ID!, input: UpdateOrderInput!): OrderResult!
    deleteOrder(id: ID!): OrderResult!
    
    createCurrency(input: CreateCurrencyInput!): CurrencyResult!
    updateCurrency(id: ID!, input: UpdateCurrencyInput!): CurrencyResult!
    deleteCurrency(id: ID!): CurrencyResult!
    
    createTax(input: CreateTaxInput!): TaxResult!
    updateTax(id: ID!, input: UpdateTaxInput!): TaxResult!
    deleteTax(id: ID!): TaxResult!
    
    # Payment mutations
    createPaymentProvider(input: CreatePaymentProviderInput!): PaymentProviderResult!
    updatePaymentProvider(id: ID!, input: UpdatePaymentProviderInput!): PaymentProviderResult!
    deletePaymentProvider(id: ID!): PaymentProviderResult!
    
    createPaymentMethod(input: CreatePaymentMethodInput!): PaymentMethodResult!
    updatePaymentMethod(id: ID!, input: UpdatePaymentMethodInput!): PaymentMethodResult!
    deletePaymentMethod(id: ID!): PaymentMethodResult!
    
    createPayment(input: CreatePaymentInput!): PaymentResult!
    updatePayment(id: ID!, input: UpdatePaymentInput!): PaymentResult!
    deletePayment(id: ID!): PaymentResult!
    
    # Shipping mutations
    createShippingProvider(input: CreateShippingProviderInput!): ShippingProviderResult!
    updateShippingProvider(id: ID!, input: UpdateShippingProviderInput!): ShippingProviderResult!
    deleteShippingProvider(id: ID!): Boolean!
    
    createShippingMethod(input: CreateShippingMethodInput!): ShippingMethodResult!
    updateShippingMethod(id: ID!, input: UpdateShippingMethodInput!): ShippingMethodResult!
    deleteShippingMethod(id: ID!): Boolean!
    
    createShippingZone(input: CreateShippingZoneInput!): ShippingZoneResult!
    updateShippingZone(id: ID!, input: UpdateShippingZoneInput!): ShippingZoneResult!
    deleteShippingZone(id: ID!): Boolean!
    
    createShippingRate(input: CreateShippingRateInput!): ShippingRateResult!
    updateShippingRate(id: ID!, input: UpdateShippingRateInput!): ShippingRateResult!
    deleteShippingRate(id: ID!): Boolean!
    
    createShipment(input: CreateShipmentInput!): ShipmentResult!
    updateShipment(id: ID!, input: UpdateShipmentInput!): ShipmentResult!
    deleteShipment(id: ID!): Boolean!
    
    # Review mutations
    createReview(input: CreateReviewInput!): ReviewResult!
    updateReview(id: ID!, input: UpdateReviewInput!): ReviewResult!
    deleteReview(id: ID!): ReviewResult!
    approveReview(id: ID!): ReviewResult!
    rejectReview(id: ID!): ReviewResult!
    reportReview(id: ID!, reason: String!): ReviewResult!
    markReviewHelpful(id: ID!): ReviewResult!
    
    createReviewResponse(input: CreateReviewResponseInput!): ReviewResponseResult!
    updateReviewResponse(id: ID!, input: UpdateReviewResponseInput!): ReviewResponseResult!
    deleteReviewResponse(id: ID!): ReviewResponseResult!
    
    # Customer mutations
    createCustomer(input: CreateCustomerInput!): CustomerResult!
    updateCustomer(id: ID!, input: UpdateCustomerInput!): CustomerResult!
    deleteCustomer(id: ID!): CustomerResult!
    
    # Discount mutations
    createDiscount(input: CreateDiscountInput!): DiscountResult!
    updateDiscount(id: ID!, input: UpdateDiscountInput!): DiscountResult!
    deleteDiscount(id: ID!): DiscountResult!
    activateDiscount(id: ID!): DiscountResult!
    deactivateDiscount(id: ID!): DiscountResult!
    
    # Digital Signage mutations
    generateDevicePairingCode(input: GenerateDevicePairingCodeInput!): PairingCodeResponse!
    pairSignageDevice(input: PairSignageDeviceInput!): DevicePairedResponse!
    assignPlaylistToDevice(input: AssignPlaylistToDeviceInput!): Device!
    uploadSignageMedia(input: UploadSignageMediaInput!): SignageMedia!
    createPlaylist(input: CreatePlaylistInput!): Playlist!
    addMediaToPlaylist(input: AddMediaToPlaylistInput!): Playlist!
    updatePlaylist(id: ID!, input: UpdatePlaylistInput!): PlaylistResult!
    deletePlaylist(id: ID!): PlaylistResult!
    removeMediaFromPlaylist(playlistId: ID!, mediaId: ID!): PlaylistResult!
    updateDeviceStatus(deviceId: ID!, status: DeviceStatus!): DeviceResult!
    deleteSignageMedia(id: ID!): SignageMediaResult!
  }

  # HeaderStyle type for storing header configuration
  type HeaderStyle {
    id: ID!
    menuId: String!
    transparency: Int
    headerSize: HeaderSize
    menuAlignment: MenuAlignment
    menuButtonStyle: MenuButtonStyle
    mobileMenuStyle: MobileMenuStyle
    mobileMenuPosition: MobileMenuPosition
    transparentHeader: Boolean
    borderBottom: Boolean
    fixedHeader: Boolean
    advancedOptions: JSON
    createdAt: DateTime
    updatedAt: DateTime
  }

  # FooterStyle type for storing footer configuration
  type FooterStyle {
    id: ID!
    menuId: String!
    transparency: Int
    columnLayout: String
    socialAlignment: String
    borderTop: Boolean
    alignment: String
    padding: String
    width: String
    advancedOptions: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # Enum types for footer customization
  enum FooterColumnLayout {
    stacked
    grid
    flex
  }

  enum SocialAlignment {
    left
    center
    right
  }

  enum FooterAlignment {
    left
    center
    right
  }

  enum FooterPadding {
    small
    medium
    large
  }

  enum FooterWidth {
    full
    container
    narrow
  }

  # Input for footer style
  input FooterStyleInput {
    transparency: Int
    columnLayout: String
    socialAlignment: String
    borderTop: Boolean
    alignment: String
    padding: String
    width: String
    advancedOptions: JSON
  }

  # Enum types for header customization
  enum HeaderSize {
    sm
    md
    lg
  }

  enum MenuAlignment {
    left
    center
    right
  }

  enum MenuButtonStyle {
    default
    filled
    outline
  }

  enum MobileMenuStyle {
    fullscreen
    dropdown
    sidebar
  }

  enum MobileMenuPosition {
    left
    right
  }

  # Input for header style
  input HeaderStyleInput {
    transparency: Int
    headerSize: HeaderSize
    menuAlignment: MenuAlignment
    menuButtonStyle: MenuButtonStyle
    mobileMenuStyle: MobileMenuStyle
    mobileMenuPosition: MobileMenuPosition
    transparentHeader: Boolean
    borderBottom: Boolean
    fixedHeader: Boolean
    advancedOptions: JSON
  }

  # Input for header advanced options
  input HeaderAdvancedOptionsInput {
    glassmorphism: Boolean
    blur: Int
    shadow: String
    animation: String
    customClass: String
    borderRadius: String
  }

  # HeaderStyleResult type for updating header style
  type HeaderStyleResult {
    success: Boolean!
    message: String!
    headerStyle: HeaderStyle
  }

  # FooterStyleResult type for updating footer style
  type FooterStyleResult {
    success: Boolean!
    message: String!
    footerStyle: FooterStyle
  }

  # Blog types
  type Blog {
    id: ID!
    title: String!
    description: String
    slug: String!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    posts: [Post!]
  }

  type Post {
    id: ID!
    title: String!
    slug: String!
    content: String!
    excerpt: String
    # featuredImage: String, // Field removed, use featuredImageMedia.fileUrl
    featuredImageId: String
    featuredImageMedia: Media
    status: PostStatus!
    publishedAt: DateTime
    blogId: String!
    authorId: String!
    metaTitle: String
    metaDescription: String
    tags: [String!]!
    categories: [String!]!
    readTime: Int
    createdAt: DateTime!
    updatedAt: DateTime!
    blog: Blog
    author: User
    media: [Media!]!
  }

  type Media {
    id: ID!
    title: String
    description: String
    fileUrl: String!
    fileName: String!
    fileSize: Int
    fileType: String
    altText: String
    cmsSectionId: String
    uploadedById: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    cmsSection: CMSSection
    posts: [Post!]!
    featuredInPosts: [Post!]!
  }

  enum PostStatus {
    DRAFT
    PUBLISHED
    ARCHIVED
  }

  # Blog input types
  input BlogInput {
    title: String!
    description: String
    slug: String!
    isActive: Boolean
  }

  input CreatePostInput {
    title: String!
    slug: String!
    content: String!
    excerpt: String
    # featuredImage: String, // Field removed, use featuredImageId
    featuredImageId: String
    status: PostStatus
    publishedAt: DateTime
    blogId: String!
    authorId: String!
    metaTitle: String
    metaDescription: String
    tags: [String!]
    categories: [String!]
    readTime: Int
    mediaIds: [String!]
  }

  input UpdatePostInput {
    title: String
    slug: String
    content: String
    excerpt: String
    # featuredImage: String, // Field removed, use featuredImageId
    featuredImageId: String
    status: PostStatus
    publishedAt: DateTime
    metaTitle: String
    metaDescription: String
    tags: [String!]
    categories: [String!]
    readTime: Int
    mediaIds: [String!]
  }

  input MediaInput {
    title: String
    description: String
    fileUrl: String!
    fileName: String!
    fileSize: Int
    fileType: String
    altText: String
  }

  input CreateMediaInput {
    title: String
    description: String
    fileUrl: String!
    fileName: String!
    fileSize: Int
    fileType: String
    altText: String
    cmsSectionId: String
  }

  input UpdateMediaInput {
    title: String
    description: String
    altText: String
  }

  input PostFilter {
    blogId: String
    status: PostStatus
    authorId: String
    tags: [String!]
    categories: [String!]
    search: String
    limit: Int
    offset: Int
  }

  # Blog result types
  type BlogResult {
    success: Boolean!
    message: String!
    blog: Blog
  }

  type PostResult {
    success: Boolean!
    message: String!
    post: Post
  }

  # Media result types
  type MediaResult {
    success: Boolean!
    message: String!
    media: Media
  }

  # --------------- BOOKING MODULE INPUTS AND CONNECTIONS --- V1 ---
  
  # Input types for booking queries
  input BookingFilterInput {
    status: BookingStatus
    serviceId: ID
    locationId: ID
    staffProfileId: ID
    customerId: ID
    startDate: DateTime
    endDate: DateTime
    search: String
  }

  input PaginationInput {
    limit: Int
    offset: Int
    page: Int
    pageSize: Int
  }

  # Connection types for paginated results
  type BookingConnection {
    edges: [BookingEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type BookingEdge {
    node: Booking!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  # Input types for booking mutations
  input CreateBookingInput {
    customerId: ID
    customerName: String!
    customerEmail: String!
    customerPhone: String!
    serviceId: ID!
    locationId: ID!
    staffProfileId: ID
    bookingDate: DateTime!
    startTime: DateTime!
    endTime: DateTime!
    notes: String
    communicationPreferences: [String!]
  }

  input UpdateBookingInput {
    customerId: ID
    customerName: String
    customerEmail: String
    customerPhone: String
    serviceId: ID
    locationId: ID
    staffProfileId: ID
    bookingDate: DateTime
    startTime: DateTime
    endTime: DateTime
    status: BookingStatus
    notes: String
    communicationPreferences: [String!]
  }

  # Input types for staff profile management
  input CreateStaffProfileInput {
    userId: ID!
    bio: String
    specializations: [String!]
  }

  input UpdateStaffProfileInput {
    userId: ID
    bio: String
    specializations: [String!]
  }

  input StaffScheduleInput {
    staffProfileId: ID!
    locationId: ID
    date: DateTime
    dayOfWeek: DayOfWeek
    startTime: String!
    endTime: String!
    scheduleType: ScheduleType!
    isAvailable: Boolean!
    notes: String
  }

  # Input types for service management
  input CreateServiceInput {
    name: String!
    description: String
    durationMinutes: Int!
    bufferTimeBeforeMinutes: Int
    bufferTimeAfterMinutes: Int
    preparationTimeMinutes: Int
    cleanupTimeMinutes: Int
    maxDailyBookingsPerService: Int
    isActive: Boolean
    serviceCategoryId: ID!
    locationIds: [ID!]
  }

  input UpdateServiceInput {
    name: String
    description: String
    durationMinutes: Int
    bufferTimeBeforeMinutes: Int
    bufferTimeAfterMinutes: Int
    preparationTimeMinutes: Int
    cleanupTimeMinutes: Int
    maxDailyBookingsPerService: Int
    isActive: Boolean
    serviceCategoryId: ID
    locationIds: [ID!]
  }

  # Input types for location management
  input CreateLocationInput {
    name: String!
    address: String
    phone: String
    operatingHours: JSON
  }

  input UpdateLocationInput {
    name: String
    address: String
    phone: String
    operatingHours: JSON
  }

  # Input types for service category management
  input CreateServiceCategoryInput {
    name: String!
    description: String
    displayOrder: Int
    parentId: ID
  }

  input UpdateServiceCategoryInput {
    name: String
    description: String
    displayOrder: Int
    parentId: ID
  }

  # Input type for booking rules
  input BookingRuleInput {
    advanceBookingHoursMin: Int!
    advanceBookingDaysMax: Int!
    sameDayCutoffTime: String
    bufferBetweenAppointmentsMinutes: Int!
    maxAppointmentsPerDayPerStaff: Int
    bookingSlotIntervalMinutes: Int!
  }

  # Input type for global booking rules (same as BookingRuleInput but for updateGlobalBookingRules)
  input GlobalBookingRuleInput {
    advanceBookingHoursMin: Int!
    advanceBookingDaysMax: Int!
    sameDayCutoffTime: String
    bufferBetweenAppointmentsMinutes: Int!
    maxAppointmentsPerDayPerStaff: Int
    bookingSlotIntervalMinutes: Int!
  }

  # Result types for booking operations
  type BookingResult {
    success: Boolean!
    message: String!
    booking: Booking
  }

  type StaffProfileResult {
    success: Boolean!
    message: String!
    staffProfile: StaffProfile
  }

  type ServiceResult {
    success: Boolean!
    message: String!
    service: Service
  }

  type LocationResult {
    success: Boolean!
    message: String!
    location: Location
  }

  type ServiceCategoryResult {
    success: Boolean!
    message: String!
    serviceCategory: ServiceCategory
  }

  # --------------- END BOOKING MODULE INPUTS AND CONNECTIONS --- V1 ---

  # --------------- E-COMMERCE MODULE TYPES --- V1 ---
  
  type Shop {
    id: ID!
    name: String!
    defaultCurrencyId: String!
    defaultCurrency: Currency!
    acceptedCurrencies: [Currency!]!
    adminUserId: String!
    adminUser: User!
    createdAt: DateTime!
    updatedAt: DateTime!
    products: [Product!]!
    productCategories: [ProductCategory!]!
    orders: [Order!]!
  }

  type Product {
    id: ID!
    name: String!
    description: String
    sku: String!
    stockQuantity: Int!
    shopId: String!
    shop: Shop!
    categoryId: String
    category: ProductCategory
    prices: [Price!]!
    reviews: [Review!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ProductCategory {
    id: ID!
    name: String!
    description: String
    slug: String!
    parentId: String
    parent: ProductCategory
    children: [ProductCategory!]!
    isActive: Boolean!
    shopId: String
    shop: Shop
    products: [Product!]!
    productCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Order {
    id: ID!
    customerId: String
    customer: User
    customerName: String!
    customerEmail: String!
    status: OrderStatus!
    totalAmount: Float!
    currencyId: String!
    currency: Currency!
    shopId: String!
    shop: Shop!
    items: [OrderItem!]!
    shipments: [Shipment!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type OrderItem {
    id: ID!
    orderId: String!
    order: Order!
    productId: String!
    product: Product!
    quantity: Int!
    unitPrice: Float!
    totalPrice: Float!
  }

  type Tax {
    id: ID!
    name: String!
    rate: Float!
    isActive: Boolean!
    shopId: String!
    shop: Shop!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum OrderStatus {
    PENDING
    PROCESSING
    SHIPPED
    DELIVERED
    CANCELLED
    REFUNDED
  }

  # E-commerce input types
  input CreateShopInput {
    name: String!
    defaultCurrencyId: String!
    acceptedCurrencyIds: [String!]
    adminUserId: String!
  }

  input UpdateShopInput {
    name: String
    defaultCurrencyId: String
    acceptedCurrencyIds: [String!]
    adminUserId: String
  }

  input CreateProductInput {
    name: String!
    description: String
    sku: String!
    stockQuantity: Int!
    shopId: String!
    categoryId: String
    prices: [CreatePriceInput!]!
  }

  input UpdateProductInput {
    name: String
    description: String
    sku: String
    stockQuantity: Int
    categoryId: String
    prices: [CreatePriceInput!]
  }

  input CreatePriceInput {
    amount: Float!
    currencyId: String!
    priceIncludesTax: Boolean!
  }

  input CreateOrderInput {
    customerId: String
    customerName: String!
    customerEmail: String!
    shopId: String!
    items: [CreateOrderItemInput!]!
  }

  input CreateOrderItemInput {
    productId: String!
    quantity: Int!
    unitPrice: Float!
  }

  input UpdateOrderInput {
    status: OrderStatus
    customerName: String
    customerEmail: String
  }

  input CreateCurrencyInput {
    code: String!
    name: String!
    symbol: String!
  }

  input UpdateCurrencyInput {
    code: String
    name: String
    symbol: String
  }

  input CreateTaxInput {
    name: String!
    rate: Float!
    isActive: Boolean!
    shopId: String!
  }

  input UpdateTaxInput {
    name: String
    rate: Float
    isActive: Boolean
  }

  # E-commerce result types
  type ShopResult {
    success: Boolean!
    message: String!
    shop: Shop
  }

  type ProductResult {
    success: Boolean!
    message: String!
    product: Product
  }

  type ProductCategoryResult {
    success: Boolean!
    message: String!
    category: ProductCategory
  }

  type OrderResult {
    success: Boolean!
    message: String!
    order: Order
  }

  type CurrencyResult {
    success: Boolean!
    message: String!
    currency: Currency
  }

  type TaxResult {
    success: Boolean!
    message: String!
    tax: Tax
  }

  type PaymentProviderResult {
    success: Boolean!
    message: String!
    provider: PaymentProvider
  }

  type PaymentMethodResult {
    success: Boolean!
    message: String!
    method: PaymentMethod
  }

  type PaymentResult {
    success: Boolean!
    message: String!
    payment: Payment
  }

  # E-commerce filter inputs
  input ShopFilterInput {
    search: String
    adminUserId: String
    currencyId: String
  }

  input ProductFilterInput {
    search: String
    shopId: String
    categoryId: String
    inStock: Boolean
    minPrice: Float
    maxPrice: Float
  }

  input ProductCategoryFilterInput {
    search: String
    shopId: String
    parentId: String
    isActive: Boolean
  }

  input OrderFilterInput {
    search: String
    shopId: String
    customerId: String
    status: OrderStatus
    dateFrom: DateTime
    dateTo: DateTime
  }

  input CreateProductCategoryInput {
    name: String!
    description: String
    slug: String!
    parentId: String
    isActive: Boolean
    shopId: String
  }

  input UpdateProductCategoryInput {
    name: String
    description: String
    slug: String
    parentId: String
    isActive: Boolean
  }

  input CreatePaymentProviderInput {
    name: String!
    type: String!
    isActive: Boolean
    apiKey: String
    secretKey: String
    webhookUrl: String
  }

  input UpdatePaymentProviderInput {
    name: String
    type: String
    isActive: Boolean
    apiKey: String
    secretKey: String
    webhookUrl: String
  }

  input CreatePaymentMethodInput {
    name: String!
    type: String!
    providerId: String!
    isActive: Boolean
    processingFeeRate: Float
    fixedFee: Float
  }

  input UpdatePaymentMethodInput {
    name: String
    type: String
    providerId: String
    isActive: Boolean
    processingFeeRate: Float
    fixedFee: Float
  }

  input CreatePaymentInput {
    orderId: String
    amount: Float!
    currencyId: String!
    paymentMethodId: String!
    providerId: String!
    transactionId: String
  }

  input UpdatePaymentInput {
    status: PaymentStatus
    transactionId: String
    gatewayResponse: String
    failureReason: String
    refundAmount: Float
  }

  input PaymentProviderFilterInput {
    search: String
    type: String
    isActive: Boolean
  }

  input PaymentMethodFilterInput {
    search: String
    providerId: String
    type: String
    isActive: Boolean
  }

  input PaymentFilterInput {
    search: String
    orderId: String
    status: PaymentStatus
    providerId: String
    paymentMethodId: String
    dateFrom: DateTime
    dateTo: DateTime
  }

  # --------------- END E-COMMERCE MODULE TYPES --- V1 ---

  type PaymentProvider {
    id: ID!
    name: String!
    type: String!
    isActive: Boolean!
    apiKey: String
    secretKey: String
    webhookUrl: String
    paymentMethods: [PaymentMethod!]!
    payments: [Payment!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type PaymentMethod {
    id: ID!
    name: String!
    type: String!
    providerId: String!
    provider: PaymentProvider!
    isActive: Boolean!
    processingFeeRate: Float
    fixedFee: Float
    payments: [Payment!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum PaymentStatus {
    PENDING
    PROCESSING
    COMPLETED
    FAILED
    CANCELLED
    REFUNDED
    PARTIALLY_REFUNDED
  }

  type Payment {
    id: ID!
    orderId: String
    order: Order
    amount: Float!
    currencyId: String!
    currency: Currency!
    status: PaymentStatus!
    paymentMethodId: String!
    paymentMethod: PaymentMethod!
    providerId: String!
    provider: PaymentProvider!
    transactionId: String
    gatewayResponse: String
    failureReason: String
    refundAmount: Float
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # --------------- SHIPPING MODULE TYPES --- V1 ---

  enum ShipmentStatus {
    PENDING
    PROCESSING
    SHIPPED
    IN_TRANSIT
    OUT_FOR_DELIVERY
    DELIVERED
    FAILED
    RETURNED
    CANCELLED
  }

  type ShippingProvider {
    id: ID!
    name: String!
    type: String!
    isActive: Boolean!
    apiKey: String
    secretKey: String
    webhookUrl: String
    trackingUrl: String
    shippingMethods: [ShippingMethod!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ShippingMethod {
    id: ID!
    name: String!
    description: String
    providerId: String!
    provider: ShippingProvider!
    isActive: Boolean!
    estimatedDaysMin: Int
    estimatedDaysMax: Int
    trackingEnabled: Boolean!
    shippingRates: [ShippingRate!]!
    shipments: [Shipment!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ShippingZone {
    id: ID!
    name: String!
    description: String
    countries: [String!]!
    states: [String!]!
    postalCodes: [String!]!
    isActive: Boolean!
    shippingRates: [ShippingRate!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ShippingRate {
    id: ID!
    shippingMethodId: String!
    shippingMethod: ShippingMethod!
    shippingZoneId: String!
    shippingZone: ShippingZone!
    minWeight: Float
    maxWeight: Float
    minValue: Float
    maxValue: Float
    baseRate: Float!
    perKgRate: Float
    freeShippingMin: Float
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Shipment {
    id: ID!
    orderId: String!
    order: Order!
    shippingMethodId: String!
    shippingMethod: ShippingMethod!
    trackingNumber: String
    status: ShipmentStatus!
    shippingCost: Float!
    weight: Float
    dimensions: String
    fromAddress: String!
    toAddress: String!
    shippedAt: DateTime
    estimatedDelivery: DateTime
    deliveredAt: DateTime
    providerResponse: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # Shipping filter inputs
  input ShippingProviderFilterInput {
    search: String
    type: String
    isActive: Boolean
  }

  input ShippingMethodFilterInput {
    search: String
    providerId: String
    isActive: Boolean
  }

  input ShippingZoneFilterInput {
    search: String
    isActive: Boolean
  }

  input ShippingRateFilterInput {
    search: String
    shippingMethodId: String
    shippingZoneId: String
    isActive: Boolean
  }

  input ShipmentFilterInput {
    search: String
    orderId: String
    status: ShipmentStatus
    shippingMethodId: String
    trackingNumber: String
    dateFrom: DateTime
    dateTo: DateTime
  }

  # Shipping input types
  input CreateShippingProviderInput {
    name: String!
    type: String!
    isActive: Boolean
    apiKey: String
    secretKey: String
    webhookUrl: String
    trackingUrl: String
  }

  input UpdateShippingProviderInput {
    name: String
    type: String
    isActive: Boolean
    apiKey: String
    secretKey: String
    webhookUrl: String
    trackingUrl: String
  }

  input CreateShippingMethodInput {
    name: String!
    description: String
    providerId: String!
    isActive: Boolean
    estimatedDaysMin: Int
    estimatedDaysMax: Int
    trackingEnabled: Boolean
  }

  input UpdateShippingMethodInput {
    name: String
    description: String
    providerId: String
    isActive: Boolean
    estimatedDaysMin: Int
    estimatedDaysMax: Int
    trackingEnabled: Boolean
  }

  input CreateShippingZoneInput {
    name: String!
    description: String
    countries: [String!]!
    states: [String!]
    postalCodes: [String!]
    isActive: Boolean
  }

  input UpdateShippingZoneInput {
    name: String
    description: String
    countries: [String!]
    states: [String!]
    postalCodes: [String!]
    isActive: Boolean
  }

  input CreateShippingRateInput {
    shippingMethodId: String!
    shippingZoneId: String!
    minWeight: Float
    maxWeight: Float
    minValue: Float
    maxValue: Float
    baseRate: Float!
    perKgRate: Float
    freeShippingMin: Float
    isActive: Boolean
  }

  input UpdateShippingRateInput {
    shippingMethodId: String
    shippingZoneId: String
    minWeight: Float
    maxWeight: Float
    minValue: Float
    maxValue: Float
    baseRate: Float
    perKgRate: Float
    freeShippingMin: Float
    isActive: Boolean
  }

  input CreateShipmentInput {
    orderId: String!
    shippingMethodId: String!
    trackingNumber: String
    shippingCost: Float!
    weight: Float
    dimensions: String
    fromAddress: String!
    toAddress: String!
    estimatedDelivery: DateTime
  }

  input UpdateShipmentInput {
    trackingNumber: String
    status: ShipmentStatus
    shippingCost: Float
    weight: Float
    dimensions: String
    fromAddress: String
    toAddress: String
    shippedAt: DateTime
    estimatedDelivery: DateTime
    deliveredAt: DateTime
    providerResponse: String
  }

  # --------------- END SHIPPING MODULE TYPES --- V1 ---

  # Shipping result types
  type ShippingProviderResult {
    success: Boolean!
    message: String!
    provider: ShippingProvider
  }

  type ShippingMethodResult {
    success: Boolean!
    message: String!
    method: ShippingMethod
  }

  type ShippingZoneResult {
    success: Boolean!
    message: String!
    zone: ShippingZone
  }

  type ShippingRateResult {
    success: Boolean!
    message: String!
    rate: ShippingRate
  }

  type ShipmentResult {
    success: Boolean!
    message: String!
    shipment: Shipment
  }

  # --------------- REVIEW MODULE TYPES --- V1 ---

  enum ReviewStatus {
    PENDING
    APPROVED
    REJECTED
    REPORTED
  }

  type Review {
    id: ID!
    productId: String!
    product: Product!
    customerId: String
    customer: User
    customerName: String!
    customerEmail: String!
    rating: Int!
    title: String
    comment: String
    isVerified: Boolean!
    isApproved: Boolean!
    isHelpful: Int!
    isReported: Boolean!
    reportReason: String
    orderItemId: String
    orderItem: OrderItem
    images: [ReviewImage!]!
    response: ReviewResponse
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ReviewImage {
    id: ID!
    reviewId: String!
    review: Review!
    imageUrl: String!
    altText: String
    order: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ReviewResponse {
    id: ID!
    reviewId: String!
    review: Review!
    responderId: String!
    responder: User!
    response: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ReviewStats {
    totalReviews: Int!
    averageRating: Float!
    ratingDistribution: [RatingCount!]!
    verifiedReviews: Int!
    pendingReviews: Int!
  }

  type RatingCount {
    rating: Int!
    count: Int!
  }

  # Review filter inputs
  input ReviewFilterInput {
    search: String
    productId: String
    customerId: String
    rating: Int
    isVerified: Boolean
    isApproved: Boolean
    isReported: Boolean
    dateFrom: DateTime
    dateTo: DateTime
  }

  # Review input types
  input CreateReviewInput {
    productId: String!
    customerId: String
    customerName: String!
    customerEmail: String!
    rating: Int!
    title: String
    comment: String
    orderItemId: String
    images: [CreateReviewImageInput!]
  }

  input UpdateReviewInput {
    rating: Int
    title: String
    comment: String
    isApproved: Boolean
    isReported: Boolean
    reportReason: String
  }

  input CreateReviewImageInput {
    imageUrl: String!
    altText: String
    order: Int
  }

  input CreateReviewResponseInput {
    reviewId: String!
    response: String!
  }

  input UpdateReviewResponseInput {
    response: String!
  }

  # Review result types
  type ReviewResult {
    success: Boolean!
    message: String!
    review: Review
  }

  type ReviewResponseResult {
    success: Boolean!
    message: String!
    response: ReviewResponse
  }

  # --------------- END REVIEW MODULE TYPES --- V1 ---

  # --------------- CUSTOMER MODULE TYPES --- V1 ---

  type Customer {
    id: ID!
    email: String!
    firstName: String
    lastName: String
    phoneNumber: String
    profileImageUrl: String
    isActive: Boolean!
    emailVerified: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Customer-specific fields
    totalOrders: Int!
    totalSpent: Float!
    averageOrderValue: Float!
    lastOrderDate: DateTime
    
    # Relations
    orders: [Order!]!
    reviews: [Review!]!
    addresses: [CustomerAddress!]!
  }

  type CustomerAddress {
    id: ID!
    customerId: String!
    customer: Customer!
    type: AddressType!
    firstName: String!
    lastName: String!
    company: String
    address1: String!
    address2: String
    city: String!
    state: String!
    postalCode: String!
    country: String!
    phone: String
    isDefault: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type CustomerStats {
    totalCustomers: Int!
    newCustomersThisMonth: Int!
    activeCustomers: Int!
    averageOrderValue: Float!
    topCustomers: [Customer!]!
  }

  enum AddressType {
    BILLING
    SHIPPING
  }

  # Customer filter inputs
  input CustomerFilterInput {
    search: String
    isActive: Boolean
    hasOrders: Boolean
    registeredFrom: DateTime
    registeredTo: DateTime
    totalSpentMin: Float
    totalSpentMax: Float
  }

  # Customer input types
  input CreateCustomerInput {
    email: String!
    firstName: String!
    lastName: String!
    phoneNumber: String
    password: String
    isActive: Boolean
  }

  input UpdateCustomerInput {
    firstName: String
    lastName: String
    phoneNumber: String
    profileImageUrl: String
    isActive: Boolean
  }

  input CreateCustomerAddressInput {
    customerId: String!
    type: AddressType!
    firstName: String!
    lastName: String!
    company: String
    address1: String!
    address2: String
    city: String!
    state: String!
    postalCode: String!
    country: String!
    phone: String
    isDefault: Boolean
  }

  # Customer result types
  type CustomerResult {
    success: Boolean!
    message: String!
    customer: Customer
  }

  # --------------- END CUSTOMER MODULE TYPES --- V1 ---

  # --------------- DISCOUNT MODULE TYPES --- V1 ---

  enum DiscountType {
    PERCENTAGE
    FIXED_AMOUNT
    FREE_SHIPPING
    BUY_X_GET_Y
  }

  enum DiscountStatus {
    ACTIVE
    INACTIVE
    EXPIRED
    SCHEDULED
  }

  type Discount {
    id: ID!
    code: String!
    name: String!
    description: String
    type: DiscountType!
    value: Float!
    minimumOrderAmount: Float
    maximumDiscountAmount: Float
    usageLimit: Int
    usageCount: Int!
    customerUsageLimit: Int
    isActive: Boolean!
    startsAt: DateTime
    exdsAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Relations
    applicableProducts: [Product!]!
    applicableCategories: [ProductCategory!]!
    excludedProducts: [Product!]!
    excludedCategories: [ProductCategory!]!
    orders: [Order!]!
  }

  type DiscountValidation {
    isValid: Boolean!
    discount: Discount
    discountAmount: Float!
    message: String!
    errors: [String!]!
  }

  # Discount filter inputs
  input DiscountFilterInput {
    search: String
    type: DiscountType
    isActive: Boolean
    startsFrom: DateTime
    startsTo: DateTime
    expiresFrom: DateTime
    expiresTo: DateTime
  }

  # Discount input types
  input CreateDiscountInput {
    code: String!
    name: String!
    description: String
    type: DiscountType!
    value: Float!
    minimumOrderAmount: Float
    maximumDiscountAmount: Float
    usageLimit: Int
    customerUsageLimit: Int
    isActive: Boolean
    startsAt: DateTime
    expiresAt: DateTime
    applicableProductIds: [String!]
    applicableCategoryIds: [String!]
    excludedProductIds: [String!]
    excludedCategoryIds: [String!]
  }

  input UpdateDiscountInput {
    name: String
    description: String
    value: Float
    minimumOrderAmount: Float
    maximumDiscountAmount: Float
    usageLimit: Int
    customerUsageLimit: Int
    isActive: Boolean
    startsAt: DateTime
    expiresAt: DateTime
    applicableProductIds: [String!]
    applicableCategoryIds: [String!]
    excludedProductIds: [String!]
    excludedCategoryIds: [String!]
  }

  # Discount result types
  type DiscountResult {
    success: Boolean!
    message: String!
    discount: Discount
  }

  # --------------- END DISCOUNT MODULE TYPES --- V1 ---

  # --------------- DIGITAL SIGNAGE MODULE TYPES --- V1 ---

  enum DeviceStatus {
    PENDING
    ONLINE
    OFFLINE
    ERROR
    UNPAIRED
  }

  enum SignageMediaType {
    VIDEO
    IMAGE
    DOCUMENT
    AUDIO
  }

  type Device {
    id: ID!
    name: String
    status: DeviceStatus!
    lastSeenAt: DateTime
    organizationId: ID!
    currentPlaylistId: ID
    deviceToken: String
    ipAddress: String
    userAgent: String
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Relations
    currentPlaylist: Playlist
    pairingCodes: [PairingCode!]!
  }

  type PairingCode {
    id: ID!
    code: String!
    qrCodeValue: String!
    organizationId: ID!
    deviceId: ID
    expiresAt: DateTime!
    isUsed: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Relations
    device: Device
  }

  type PairingCodeResponse {
    code: String!
    expiresAt: DateTime!
    qrCodeValue: String!
  }

  type DevicePairedResponse {
    success: Boolean!
    message: String
    device: Device
    token: String
  }

  type SignageMedia {
    id: ID!
    name: String!
    type: SignageMediaType!
    mimeType: String
    url: String!
    thumbnailUrl: String
    sizeBytes: Int
    durationSeconds: Int
    width: Int
    height: Int
    organizationId: ID!
    uploadedByUserId: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Relations
    uploadedBy: User!
    playlistItems: [PlaylistItem!]!
  }

  type Playlist {
    id: ID!
    name: String!
    description: String
    organizationId: ID!
    createdByUserId: ID!
    isActive: Boolean!
    totalDuration: Int
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Relations
    createdBy: User!
    items: [PlaylistItem!]!
    assignedDevices: [Device!]!
  }

  type PlaylistItem {
    id: ID!
    playlistId: ID!
    mediaId: ID!
    order: Int!
    durationSeconds: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Relations
    playlist: Playlist!
    media: SignageMedia!
  }

  # Input types for Digital Signage
  input GenerateDevicePairingCodeInput {
    organizationId: ID!
  }

  input PairSignageDeviceInput {
    pairingCode: String!
    deviceName: String
  }

  input AssignPlaylistToDeviceInput {
    organizationId: ID!
    deviceId: ID!
    playlistId: ID
  }

  input UploadSignageMediaInput {
    organizationId: ID!
    uploadedByUserId: ID!
    name: String!
    type: SignageMediaType!
    mimeType: String
    sizeBytes: Int
    durationSeconds: Int
    width: Int
    height: Int
  }

  input CreatePlaylistInput {
    organizationId: ID!
    createdByUserId: ID!
    name: String!
    description: String
  }

  input AddMediaToPlaylistInput {
    organizationId: ID!
    playlistId: ID!
    mediaId: ID!
    order: Int
    durationSeconds: Int!
  }

  input UpdatePlaylistInput {
    name: String
    description: String
    isActive: Boolean
  }

  input DeviceFilterInput {
    organizationId: ID!
    status: DeviceStatus
    search: String
  }

  input MediaFilterInput {
    organizationId: ID!
    type: SignageMediaType
    search: String
  }

  input PlaylistFilterInput {
    organizationId: ID!
    isActive: Boolean
    search: String
  }

  # Result types
  type SignageMediaResult {
    success: Boolean!
    message: String!
    media: SignageMedia
  }

  type PlaylistResult {
    success: Boolean!
    message: String!
    playlist: Playlist
  }

  type DeviceResult {
    success: Boolean!
    message: String!
    device: Device
  }

  # --------------- END DIGITAL SIGNAGE MODULE TYPES --- V1 ---

  # Shipping result types
`; 
