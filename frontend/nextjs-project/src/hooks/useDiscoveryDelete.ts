import { deletePostAction } from "@/app/actions/deleteActions";
import { useState } from "react";
import { mutate } from "swr";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";

export const useDiscoveryDelete = () => {
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] =
    useState<boolean>(false);
  const [isProcessingDelete, setIsProcessingDelete] = useState<boolean>(false);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const openDeleteConfirmModal = () => {
    setIsDeleteConfirmModalOpen(true);
  };
  const closeDeleteConfirmModal = () => {
    setIsDeleteConfirmModalOpen(false);
  };

  const deleteDiscovery = async (post_id: string) => {
    setIsProcessingDelete(true);
    try {
      // server actionsを直接呼び出す
      const result = await deletePostAction(post_id);
      if (result.error) {
        alert(`投稿の削除に失敗しました ${result.error}`);
      }
      if (!result.data) {
        alert("不明なエラーが発生しました。もう一度お試しください。");
        return;
      }

      alert(`投稿の削除に成功しました`);

      router.back();

      // 一覧ページのキャッシュのみを更新する
      const listKey = user?.uid ? `recent:${user.uid}` : `recent:public`;
      mutate(listKey);
    } catch (error) {
      console.error(error);
      alert("投稿の削除に失敗しました");
    } finally {
      setIsProcessingDelete(false);
    }
  };

  return {
    deleteDiscovery,
    isDeleteConfirmModalOpen,
    openDeleteConfirmModal,
    closeDeleteConfirmModal,
    isProcessingDelete,
  };
};
