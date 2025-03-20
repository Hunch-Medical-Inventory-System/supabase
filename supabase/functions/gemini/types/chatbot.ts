export type Chat = string
export type Message = {
  type: 0 | 1
  message: Chat
}
export type ChatbotState = {
  loading: boolean;
  error: null;
  chatLog: Message[]
};