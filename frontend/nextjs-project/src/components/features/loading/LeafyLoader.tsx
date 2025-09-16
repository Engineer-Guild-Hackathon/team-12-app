import styles from "./LeafyLoader.module.css"; // CSSモジュールをインポート
import { IoLeaf } from "react-icons/io5";

export default function LeafyLoader() {
  return (
    <div className={styles.loaderContainer}>
      <IoLeaf className={styles.leaf} size={24} />
      <IoLeaf className={styles.leaf} size={24} />
      <IoLeaf className={styles.leaf} size={24} />
    </div>
  );
}
