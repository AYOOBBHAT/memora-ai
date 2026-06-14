import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type DocumentsStackParamList = {
  DocumentsList: undefined;
  DocumentDetail: { documentId: string };
  CreateDocument: { collectionId?: string } | undefined;
  EditDocument: { documentId: string };
};

export type ChatStackParamList = {
  ChatMain: undefined;
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
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
