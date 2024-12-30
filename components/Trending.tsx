import {
  FlatList,
  Image,
  ImageBackground,
  ImageStyle,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import EmptyState from "./EmptyState";
import * as Animatable from "react-native-animatable";
import { useState } from "react";
import { icons } from "@/constants";
import { Video, ResizeMode } from "expo-av";

type Post = { $id: string; thumbnail: string; video: string };

type zoomProps =
  | string
  | Animatable.CustomAnimation<TextStyle & ViewStyle & ImageStyle>
  | undefined;

type TrendingItemProps = {
  activeItem: string;
  item: Post;
};

type TrendingProps = {
  posts: Post[];
};

type ViewableItemsProps = {
  viewableItems: { item: Post }[];
};

const zoomIn: zoomProps = {
  0: {
    transform: [{ scale: 0.9 }],
  },
  1: {
    transform: [{ scale: 1.1 }],
  },
};

const zoomOut: zoomProps = {
  0: {
    transform: [{ scale: 1 }],
  },
  1: {
    transform: [{ scale: 0.9 }],
  },
};

const TrendingItem = ({ activeItem, item }: TrendingItemProps) => {
  const [play, setPlay] = useState(false);

  return (
    <Animatable.View
      className="mr-5"
      animation={activeItem === item.$id ? zoomIn : zoomOut}
      duration={500}
    >
      {play ? (
        <Video
          source={{ uri: item.video }}
          className="w-52 h-72 rounded-[35px] mt-3 bg-white/10"
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls
          shouldPlay
          onPlaybackStatusUpdate={(status) => {
            if (
              status.isLoaded &&
              !status.isBuffering &&
              status.didJustFinish
            ) {
              setPlay(false);
            }
          }}
        />
      ) : (
        <TouchableOpacity
          className="relative justify-center items-center"
          activeOpacity={0.7}
          onPress={() => setPlay(true)}
        >
          <ImageBackground
            source={{
              uri: item.thumbnail,
            }}
            className="w-52 h-72 rounded-[35px] my-5 overflow-hidden shadow-lg shadow-black/40"
            resizeMode="cover"
          />
          <Image
            source={icons.play}
            className="w-12 h-12 absolute"
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}
    </Animatable.View>
  );
};

const Trending = ({ posts }: TrendingProps) => {
  const [activeItem, setActiveItem] = useState(posts[1]?.$id);

  const viewableItemsChanged = ({ viewableItems }: ViewableItemsProps) => {
    if (viewableItems.length > 0) {
      setActiveItem(viewableItems[0].item.$id);
    }
  };

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.$id}
      renderItem={({ item }) => (
        <TrendingItem activeItem={activeItem} item={item} />
      )}
      horizontal
      onViewableItemsChanged={viewableItemsChanged}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 70,
      }}
      contentOffset={{ x: 170, y: 0 }}
      ListEmptyComponent={() => (
        <Text className="text-white">
          <EmptyState
            title="No Videos Found"
            subtitle="Be the first one to upload a video"
          />
        </Text>
      )}
    />
  );
};

export default Trending;
