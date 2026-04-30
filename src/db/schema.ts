
import { pgEnum, pgTable, text, timestamp, boolean, index, integer } from "drizzle-orm/pg-core";


export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  bio: text("bio").default("").notNull(),
  phoneNumber: text("phone_number"),
  phoneVerified: boolean("phone_verified").default(false).notNull(),
  privacySettings: text("privacy_settings").default("{}").notNull(),
  themeAccent: text("theme_accent").default("#0ea5e9").notNull(),
  highContrast: boolean("high_contrast").default(false).notNull(),
  failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until"),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const project = pgTable(
  "project",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("project_ownerId_idx").on(table.ownerId)],
);

export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "in_progress",
  "done",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const projectTask = pgTable(
  "project_task",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: taskStatusEnum("status").default("todo").notNull(),
    priority: taskPriorityEnum("priority").default("medium").notNull(),
    starred: boolean("starred").default(false).notNull(),
    dueDate: timestamp("due_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("project_task_projectId_idx").on(table.projectId),
    index("project_task_ownerId_idx").on(table.ownerId),
  ],
);

export const aiConversation = pgTable(
  "ai_conversation",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("ai_conversation_userId_idx").on(table.userId)],
);

export const aiMessage = pgTable(
  "ai_message",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => aiConversation.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("ai_message_conversationId_idx").on(table.conversationId),
    index("ai_message_userId_idx").on(table.userId),
  ],
);

export const aiMemory = pgTable(
  "ai_memory",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    summary: text("summary").notNull().default(""),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("ai_memory_userId_idx").on(table.userId)],
);

export const libraryAsset = pgTable(
  "library_asset",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content").notNull(),
    collection: text("collection").notNull().default("General"),
    source: text("source").notNull().default("manual"),
    tags: text("tags").notNull().default("general"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("library_asset_userId_idx").on(table.userId)],
);

export const libraryCollection = pgTable(
  "library_collection",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("library_collection_userId_idx").on(table.userId)],
);

export const voiceAction = pgTable(
  "voice_action",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    source: text("source").notNull().default("widget"),
    transcript: text("transcript").notNull(),
    actionType: text("action_type").notNull(),
    actionPayload: text("action_payload").notNull().default("{}"),
    status: text("status").notNull().default("completed"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("voice_action_userId_idx").on(table.userId)],
);

export const semanticMetric = pgTable(
  "semantic_metric",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    metricKey: text("metric_key").notNull(),
    displayName: text("display_name").notNull(),
    formula: text("formula").notNull(),
    description: text("description"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("semantic_metric_userId_idx").on(table.userId),
    index("semantic_metric_metricKey_idx").on(table.metricKey),
  ],
);

export const weeklyDigest = pgTable(
  "weekly_digest",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    weekStartIso: text("week_start_iso").notNull(),
    weekEndIso: text("week_end_iso").notNull(),
    hoursSaved: text("hours_saved").notNull().default("0"),
    topTopics: text("top_topics").notNull().default(""),
    prediction: text("prediction").notNull().default(""),
    digestBody: text("digest_body").notNull(),
    deliveryMode: text("delivery_mode").notNull().default("in_app"),
    deliveredTo: text("delivered_to"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("weekly_digest_userId_idx").on(table.userId)],
);

export const developerApiKey = pgTable(
  "developer_api_key",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    label: text("label").notNull().default("Primary"),
    apiKey: text("api_key").notNull(),
    limit: integer("limit").notNull().default(5000),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("developer_api_key_userId_idx").on(table.userId)],
);

export const developerWebhookLog = pgTable(
  "developer_webhook_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    event: text("event").notNull(),
    statusCode: integer("status_code").notNull().default(200),
    detail: text("detail"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("developer_webhook_log_userId_idx").on(table.userId)],
);

export const modelLabProfile = pgTable(
  "model_lab_profile",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    systemPrompt: text("system_prompt").notNull().default("Always respond in a structured, practical format."),
    engine: text("engine").notNull().default("flash"),
    styleProfileEnabled: boolean("style_profile_enabled").notNull().default(false),
    knowledgeFiles: text("knowledge_files").notNull().default("[]"),
    playbooks: text("playbooks").notNull().default("[]"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("model_lab_profile_userId_idx").on(table.userId)],
);

export const retentionInsight = pgTable(
  "retention_insight",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    churnRiskScore: integer("churn_risk_score").notNull().default(0),
    weeklyHoursSaved: integer("weekly_hours_saved").notNull().default(0),
    weeklyTasksCompleted: integer("weekly_tasks_completed").notNull().default(0),
    progressiveProfile: text("progressive_profile").notNull().default("{}"),
    lastInterventionEmail: text("last_intervention_email"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("retention_insight_userId_idx").on(table.userId)],
);

export const billingProfile = pgTable(
  "billing_profile",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    plan: text("plan").notNull().default("basic"),
    monthlyFeeCents: integer("monthly_fee_cents").notNull().default(2000),
    proCallsIncluded: integer("pro_calls_included").notNull().default(100),
    proCallsUsed: integer("pro_calls_used").notNull().default(0),
    creditsRemaining: integer("credits_remaining").notNull().default(100),
    standardUnlimited: boolean("standard_unlimited").notNull().default(false),
    successFeeBps: integer("success_fee_bps").notNull().default(200),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("billing_profile_userId_idx").on(table.userId)],
);

export const billingTransaction = pgTable(
  "billing_transaction",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    credits: integer("credits").notNull().default(0),
    amountCents: integer("amount_cents").notNull().default(0),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("billing_transaction_userId_idx").on(table.userId)],
);

export const xaiLog = pgTable(
  "xai_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    taskId: text("task_id").notNull(),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    reasoning: text("reasoning").notNull(),
    sources: text("sources").notNull().default("[]"),
    complianceFlags: text("compliance_flags").notNull().default("[]"),
    modelVersion: text("model_version").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("xai_log_userId_idx").on(table.userId)],
);

export const promptTemplate = pgTable(
  "prompt_template",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    category: text("category").notNull().default("general"),
    prompt: text("prompt").notNull(),
    uses: integer("uses").notNull().default(0),
    rewardCredits: integer("reward_credits").notNull().default(0),
    isPublic: boolean("is_public").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("prompt_template_userId_idx").on(table.userId)],
);

export const promptTemplateVote = pgTable(
  "prompt_template_vote",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    templateId: text("template_id")
      .notNull()
      .references(() => promptTemplate.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("prompt_template_vote_userId_idx").on(table.userId),
    index("prompt_template_vote_templateId_idx").on(table.templateId),
  ],
);

export const chatPresence = pgTable(
  "chat_presence",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("online"),
    lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
    typingConversationId: text("typing_conversation_id"),
    typing: boolean("typing").notNull().default(false),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("chat_presence_status_idx").on(table.status)],
);

export const chatReceipt = pgTable(
  "chat_receipt",
  {
    messageId: text("message_id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sentAt: timestamp("sent_at").defaultNow().notNull(),
    deliveredAt: timestamp("delivered_at"),
    readAt: timestamp("read_at"),
  },
  (table) => [index("chat_receipt_userId_idx").on(table.userId)],
);

export const chatNotification = pgTable(
  "chat_notification",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    conversationId: text("conversation_id"),
    messageId: text("message_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    readAt: timestamp("read_at"),
  },
  (table) => [index("chat_notification_userId_idx").on(table.userId)],
);

export const chatUpload = pgTable(
  "chat_upload",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    previewUrl: text("preview_url").notNull(),
    shareUrl: text("share_url").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("chat_upload_userId_idx").on(table.userId)],
);

export const chatAuditLog = pgTable(
  "chat_audit_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    detail: text("detail").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("chat_audit_log_userId_idx").on(table.userId)],
);

export const chatReaction = pgTable(
  "chat_reaction",
  {
    id: text("id").primaryKey(),
    messageId: text("message_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("chat_reaction_userId_idx").on(table.userId),
    index("chat_reaction_messageId_idx").on(table.messageId),
  ],
);

export const chatThreadReply = pgTable(
  "chat_thread_reply",
  {
    id: text("id").primaryKey(),
    messageId: text("message_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("chat_thread_reply_userId_idx").on(table.userId),
    index("chat_thread_reply_messageId_idx").on(table.messageId),
  ],
);

export const chatIntegrationLink = pgTable(
  "chat_integration_link",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    target: text("target").notNull(),
    status: text("status").notNull().default("connected"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("chat_integration_link_userId_idx").on(table.userId)],
);

export const chatCallSession = pgTable(
  "chat_call_session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    roomName: text("room_name").notNull(),
    mode: text("mode").notNull(),
    status: text("status").notNull(),
    screenSharing: boolean("screen_sharing").notNull().default(false),
    recording: boolean("recording").notNull().default(false),
    participants: text("participants").notNull().default("[]"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("chat_call_session_userId_idx").on(table.userId)],
);

export const mcpContext = pgTable(
  "mcp_context",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    source: text("source").notNull(),
    target: text("target").notNull(),
    secureSessionToken: text("secure_session_token").notNull(),
    capabilities: text("capabilities").notNull().default("[]"),
    discoveredResources: text("discovered_resources").notNull().default("[]"),
    contextSummary: text("context_summary").notNull(),
    liveSignals: text("live_signals").notNull().default("[]"),
    connectedAt: timestamp("connected_at").defaultNow().notNull(),
    lastUsedAt: timestamp("last_used_at").defaultNow().notNull(),
  },
  (table) => [index("mcp_context_userId_idx").on(table.userId)],
);

export const desktopAgentSession = pgTable(
  "desktop_agent_session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    goal: text("goal").notNull(),
    action: text("action").notNull(),
    bridgeToken: text("bridge_token").notNull(),
    instructions: text("instructions").notNull().default("[]"),
    safetyNotes: text("safety_notes").notNull().default("[]"),
    command: text("command").notNull().default("{}"),
    result: text("result"),
    error: text("error"),
    status: text("status").notNull().default("ready"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("desktop_agent_session_userId_idx").on(table.userId)],
);
