import { deletePostAction } from "@/app/actions/deleteActions";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const useDiscoveryDelete = () => {
  const router = useRouter();
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] =
    useState<boolean>(false);
  const [isDeleteCompleteModalOpen, setIsDeleteCompleteModalOpen] =
    useState<boolean>(false);
  const [isProcessingDelete, setIsProcessingDelete] = useState<boolean>(false);
  const openDeleteConfirmModal = () => {
    setIsDeleteConfirmModalOpen(true);
  };
  const closeDeleteConfirmModal = () => {
    setIsDeleteConfirmModalOpen(false);
  };
  const openDeleteCompleteModal = () => {
    setIsDeleteCompleteModalOpen(true);
  };
  const closeDeleteCompleteModal = () => {
    setIsDeleteCompleteModalOpen(false);
    router.back();
  };

  const deleteDiscovery = async (post_id: string) => {
    try {
      setIsProcessingDelete(true);
      // server actionsを直接呼び出す
      const result = await deletePostAction(post_id);
      if (!result.error && !result.data) {
        alert("不明なエラーが発生しました。もう一度お試しください。");
        return;
      }
      if (result.data) {
        // TODO: アラートじゃなくてモーダルにする
        openDeleteCompleteModal();
        return;
      }
      if (result.error) {
        alert(`投稿の削除に失敗しました ${result.error}`);
      }
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
    isDeleteCompleteModalOpen,
    closeDeleteCompleteModal,
    isProcessingDelete,
  };
};
