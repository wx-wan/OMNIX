-- Accio work 等代理用户头像（Contact.avatar_url）与 Chatter 作者头像快照（author_avatar）
ALTER TABLE contacts ADD COLUMN "avatar_url" TEXT;
ALTER TABLE chatter_messages ADD COLUMN "author_avatar" TEXT;
