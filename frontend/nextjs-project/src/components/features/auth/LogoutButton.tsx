import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { Button } from "@mui/material";

export default function LogoutButton() {
  const { signOut } = useAuthStore();
  const router = useRouter();
  const handleLogout = async () => {
    await signOut();
    alert("ログアウトしました");
    router.push("/");
  };

  return (
    <Button
      onClick={handleLogout}
      sx={{
        backgroundColor: "kinako.900",
        color: "white",
        "&:hover": {
          backgroundColor: "kinako.700",
        },
        padding: "8px 16px",
        height: "56px",
        width: "80%",
        borderRadius: "200px",
        textTransform: "none",
        fontSize: "20px",
        alignSelf: "center",
      }}
    >
      ログアウト
    </Button>
  );
}
