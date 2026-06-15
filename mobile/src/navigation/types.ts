import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type DocumentsStackParamList = {
  DocumentsList: undefined;
  Search: undefined;
  DocumentDetail: { documentId: string };
  CreateDocument: { collectionId?: string } | undefined;
  EditDocument: { documentId: string };
};

export type ChatStackParamList = {
  ChatMain:
    | {
        conversationId?: string;
        initialMessage?: string;
        autoSend?: boolean;
      }
    | undefined;
  ChatHistory: undefined;
};

export type OnboardingStackParamList = {
  Intro: undefined;
  Category: undefined;
  FirstNote: { categoryId: string };
  FirstQuestion: { categoryId: string };
  Success: { openChat?: boolean } | undefined;
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<DocumentsStackParamList>;
  Collections: NavigatorScreenParams<CollectionsStackParamList>;
  Chat: NavigatorScreenParams<ChatStackParamList>;
  Profile: undefined;
};

export type CollectionsStackParamList = {
  CollectionsList: undefined;
  CollectionDetail: { collectionId: string };
  CreateCollection: undefined;
  EditCollection: { collectionId: string };
};

export type RootStackParamList = {
  App: NavigatorScreenParams<MainTabParamList> | undefined;
  ShareHandler: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
