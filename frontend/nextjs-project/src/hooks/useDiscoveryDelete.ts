import { deletePostAction } from "@/app/actions/deleteActions";
import { useRouter } from "next/navigation";
import { startTransition } from "react";

export const useDiscoveryDelete = () => {
  const router = useRouter();
  const deleteDiscovery = (post_id: string) => {
    const confirm = window.confirm(
      "本当にこの投稿を削除しますか？この操作は元に戻せません。",
    );
    if (!confirm) return;

    startTransition(async () => {
      // TODO: ローディングマークつける
      const result = await deletePostAction(post_id);
      if (!result.error && !result.data) {
        alert("不明なエラーが発生しました。もう一度お試しください。");
        return;
      }
      if (result.data) {
        alert("投稿が削除されました");
        router.back();
        return;
      }
      if (result.error) {
        alert(`投稿の削除に失敗しました ${result.error}`);
      }
    });
  };

  return { deleteDiscovery };
};
