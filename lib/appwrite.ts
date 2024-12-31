import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  ImageGravity,
  Query,
  Storage,
} from "react-native-appwrite";

export const config = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  platform: process.env.EXPO_PUBLIC_APPWRITE_PLATFORM,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  userCollectionId: process.env.EXPO_PUBLIC_APPWRITE_USER_COLLECTION_ID,
  videoCollectionId: process.env.EXPO_PUBLIC_APPWRITE_VIDEO_COLLECTION_ID,
  storageId: process.env.EXPO_PUBLIC_APPWRITE_STORAGE_ID,
};

const client = new Client();

client
  .setEndpoint(config.endpoint!)
  .setProject(config.projectId!)
  .setPlatform(config.platform!);

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);
const storage = new Storage(client);

export const createUser = async (
  email: string,
  password: string,
  username: string
) => {
  try {
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      username
    );

    if (!newAccount) {
      throw new Error("Failed to create user");
    }

    const avatarUrl = await avatars.getInitials(username);

    await signIn(email, password);

    const newUser = await databases.createDocument(
      config.databaseId!,
      config.userCollectionId!,
      ID.unique(),
      {
        accountId: newAccount.$id,
        email,
        username,
        avatar: avatarUrl,
      }
    );

    return newUser;
  } catch (error) {
    console.error(error);
    throw new Error(
      `Failed to create user: ${error instanceof Error ? error.message : ""}`
    );
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const session = await account.createEmailPasswordSession(email, password);

    return session;
  } catch (error) {
    console.error(error);
    throw new Error(
      `Failed to sign in: ${error instanceof Error ? error.message : ""}`
    );
  }
};

// Sign Out
export async function signOut() {
  try {
    const session = await account.deleteSession("current");

    return session;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to sign out."
    );
  }
}

export const getCurrentUser = async () => {
  try {
    const currentAccount = await account.get();

    if (!currentAccount) throw new Error("Error");

    const currentUser = await databases.listDocuments(
      config.databaseId!,
      config.userCollectionId!,
      [Query.equal("accountId", currentAccount.$id)]
    );

    if (!currentUser) throw Error;

    return currentUser.documents[0];
  } catch (e) {
    console.log(e);
  }
};

// Get all Video Posts
export const getAllPosts = async () => {
  try {
    const posts = await databases.listDocuments(
      config.databaseId!,
      config.videoCollectionId!,
      [Query.orderDesc("$createdAt")]
    );

    return posts.documents;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch all videos"
    );
  }
};

// Get latest created video posts
export const getLatestPosts = async () => {
  try {
    const posts = await databases.listDocuments(
      config.databaseId!,
      config.videoCollectionId!,
      [Query.orderDesc("$createdAt"), Query.limit(7)]
    );

    return posts.documents;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch latest videos"
    );
  }
};

export const searchPosts = async (query: string) => {
  try {
    const posts = await databases.listDocuments(
      config.databaseId!,
      config.videoCollectionId!,
      [Query.search("title", query)]
    );

    return posts.documents;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch latest videos"
    );
  }
};

export const getUserPosts = async (userId: string) => {
  try {
    const posts = await databases.listDocuments(
      config.databaseId!,
      config.videoCollectionId!,
      [Query.equal("creator", userId), Query.orderDesc("$createdAt")]
    );

    return posts.documents;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch latest videos"
    );
  }
};

// Get File Preview
export const getFilePreview = async (
  fileId: string,
  type: "video" | "image"
): Promise<string> => {
  let fileUrl: string;

  try {
    if (type === "video") {
      fileUrl = storage.getFileView(config.storageId!, fileId).toString();
    } else if (type === "image") {
      fileUrl = storage
        .getFilePreview(
          config.storageId!,
          fileId,
          2000,
          2000,
          ImageGravity.Top,
          100
        )
        .toString();
    } else {
      throw new Error("Invalid file type");
    }

    if (!fileUrl) {
      throw new Error("File URL is empty");
    }

    return fileUrl;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Error during file preview"
    );
  }
};

// Upload File
export const uploadFile = async (
  file: { name: string; mimeType: string; size: number; uri: string },
  type: "video" | "image"
): Promise<string | undefined> => {
  if (!file) return;

  const { mimeType, ...rest } = file;
  const asset = {
    name: file.name,
    type: mimeType,
    size: file.size,
    uri: file.uri,
  };

  try {
    const uploadedFile = await storage.createFile(
      config.storageId!,
      ID.unique(),
      asset
    );

    const fileUrl = await getFilePreview(uploadedFile.$id, type);
    return fileUrl;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Error during file upload"
    );
  }
};

// Create Video
export const createVideo = async (form: {
  thumbnail: any;
  video: any;
  title: string;
  prompt: string;
  userId: string;
}): Promise<any> => {
  try {
    const [thumbnailUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, "image"),
      uploadFile(form.video, "video"),
    ]);

    const newPost = await databases.createDocument(
      config.databaseId!,
      config.videoCollectionId!,
      ID.unique(),
      {
        title: form.title,
        thumbnail: thumbnailUrl,
        video: videoUrl,
        prompt: form.prompt,
        creator: form.userId,
      }
    );

    return newPost;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Error during video creation"
    );
  }
};
