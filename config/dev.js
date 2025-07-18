// 개발 환경 설정
export const DEV_CONFIG = {
  // 개발 중에는 true, 배포 시에는 false로 변경
  SHOW_DEV_MENU: true,

  // 개발 시 기본 시작 페이지
  DEFAULT_DEV_ROUTE: "dev-menu", // 'login', 'dashboard', '(tabs)' 등으로 변경 가능

  // 개발용 테스트 데이터
  TEST_USER: {
    email: "test@test.com",
    password: "password",
  },
};

// 개발 환경인지 확인하는 헬퍼 함수
export const isDevelopment = () => {
  return __DEV__ && DEV_CONFIG.SHOW_DEV_MENU;
};
