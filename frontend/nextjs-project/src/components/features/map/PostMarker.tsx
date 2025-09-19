import React, { useMemo } from "react";
import { Marker } from "react-leaflet";
import { Post } from "@/types/post";
import { createCustomIcon } from "@/utils/createCustomIcon";

interface PostMarkerProps {
  post: Post;
  isSelected: boolean;
  onMarkerClick?: (post: Post) => void;
}

const PostMarker: React.FC<PostMarkerProps> = ({
  post,
  isSelected,
  onMarkerClick,
}) => {
  // isSelected の状態が変わったときだけアイコンを再生成する
  const icon = useMemo(() => createCustomIcon(isSelected), [isSelected]);

  return (
    <Marker
      position={[post.latitude, post.longitude]}
      icon={icon}
      eventHandlers={{
        click: () => onMarkerClick?.(post),
      }}
    />
  );
};

// propsが変更されない限り、このコンポーネントの再レンダリングを防ぐ
export default React.memo(PostMarker);
