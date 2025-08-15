import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function Index() {
  const router = useRouter();
  useEffect(() => {
    // 앱 최초 진입 시 로그인 화면으로 이동
    router.replace("/splash");
  }, [router]);
  return null;
}
