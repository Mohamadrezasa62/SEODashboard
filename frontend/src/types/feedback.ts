export interface FeedbackThread {
  id: string
  title: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  created_by: import('./auth').User
  assigned_to: import('./auth').User | null
  resolved_by: import('./auth').User | null
  resolved_at: string | null
  comment_count: number
  has_unseen: boolean
  created_at: string
  updated_at: string
}

export interface FeedbackComment {
  id: string
  content: string
  author: import('./auth').User
  parent: string | null
  is_edited: boolean
  edited_at: string | null
  attachments: FeedbackAttachment[]
  mentions: FeedbackMention[]
  replies: FeedbackComment[]
  reply_count: number
  created_at: string
  updated_at: string
}

export interface FeedbackAttachment {
  id: string
  file: string
  file_name: string
  file_size: number
  file_type: string
  created_at: string
}

export interface FeedbackMention {
  id: string
  mentioned_user: import('./auth').User
  is_seen: boolean
}