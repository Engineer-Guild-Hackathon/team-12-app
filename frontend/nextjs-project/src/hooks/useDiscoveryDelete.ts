import { deletePostAction } from "@/app/actions/deleteActions";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const useDiscoveryDelete = () => {
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };
  const deleteDiscovery = async (post_id: string) => {
    // TODO: ローディングマークつける
    // server actionsを直接呼び出す
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
  };

  return {
    deleteDiscovery,
    isDeleteModalOpen,
    openDeleteModal,
    closeDeleteModal,
  };
};
