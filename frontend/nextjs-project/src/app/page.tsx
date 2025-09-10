import { Box } from "@mui/material";
import Link from "next/link";

export default function Home() {
  return (
    <Box sx={{ backgroundColor: 'kinako.100'}}>
      <nav>
        <ul>
          <li>
            <Link href="/list">一覧ページへ</Link>
          </li>
          <li>
            <Link href="/login">ログインページへ</Link>
          </li>
          <li>
            <Link href="/signup">新規登録ページへ</Link>
          </li>
          <li>
            <Link href="/discoveries/hokkaido-university-poplar-avenue">
              発見詳細ページへ
            </Link>
          </li>
        </ul>
      </nav>
    </Box>
  );
}
