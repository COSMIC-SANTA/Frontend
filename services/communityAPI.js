// 커뮤니티 관련 API 함수들

const API_BASE_URL = "http://localhost:8080/api";

// 공통 에러 메시지 상수
const NETWORK_ERROR_MESSAGE = "네트워크 오류가 발생했습니다.";

// 그룹 채팅 관련 API
export const groupAPI = {
  // 모든 그룹 목록 조회
  getAllGroups: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/groups`);
      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: data.groups || [],
        };
      } else {
        return {
          success: false,
          message: data.message || "그룹 목록을 불러오는데 실패했습니다.",
        };
      }
    } catch (error) {
      console.error("getAllGroups error:", error);
      return {
        success: false,
        message: NETWORK_ERROR_MESSAGE,
      };
    }
  },

  // 새 그룹 생성
  createGroup: async (groupData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(groupData),
      });
      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: data.group,
        };
      } else {
        return {
          success: false,
          message: data.message || "그룹 생성에 실패했습니다.",
        };
      }
    } catch (error) {
      console.error("createGroup error:", error);
      return {
        success: false,
        message: "네트워크 오류가 발생했습니다.",
      };
    }
  },

  // 그룹 상세 정보 조회
  getGroupInfo: async (groupId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}`);
      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: data.group,
        };
      } else {
        return {
          success: false,
          message: data.message || "그룹 정보를 불러오는데 실패했습니다.",
        };
      }
    } catch (error) {
      console.error("getGroupInfo error:", error);
      return {
        success: false,
        message: "네트워크 오류가 발생했습니다.",
      };
    }
  },

  // 그룹 가입
  joinGroup: async (groupId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: data,
        };
      } else {
        return {
          success: false,
          message: data.message || "그룹 가입에 실패했습니다.",
        };
      }
    } catch (error) {
      console.error("joinGroup error:", error);
      return {
        success: false,
        message: "네트워크 오류가 발생했습니다.",
      };
    }
  },
};

// 채팅 메시지 관련 API
export const chatAPI = {
  // 그룹 채팅 메시지 목록 조회
  getMessages: async (groupId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/groups/${groupId}/messages`
      );
      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: data.messages || [],
        };
      } else {
        return {
          success: false,
          message: data.message || "메시지를 불러오는데 실패했습니다.",
        };
      }
    } catch (error) {
      console.error("getMessages error:", error);
      return {
        success: false,
        message: "네트워크 오류가 발생했습니다.",
      };
    }
  },

  // 메시지 전송
  sendMessage: async (groupId, messageData) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/groups/${groupId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messageData),
        }
      );
      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: data.message,
        };
      } else {
        return {
          success: false,
          message: data.message || "메시지 전송에 실패했습니다.",
        };
      }
    } catch (error) {
      console.error("sendMessage error:", error);
      return {
        success: false,
        message: "네트워크 오류가 발생했습니다.",
      };
    }
  },
};

// 게시판 관련 API
export const boardAPI = {
  // 게시글 목록 조회
  getPosts: async (page = 1, limit = 20) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/board/posts?page=${page}&limit=${limit}`
      );
      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: data.posts || [],
          pagination: data.pagination || {},
        };
      } else {
        return {
          success: false,
          message: data.message || "게시글 목록을 불러오는데 실패했습니다.",
        };
      }
    } catch (error) {
      console.error("getPosts error:", error);
      return {
        success: false,
        message: "네트워크 오류가 발생했습니다.",
      };
    }
  },

  // 게시글 상세 조회
  getPost: async (postId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/board/posts/${postId}`);
      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: data.post,
        };
      } else {
        return {
          success: false,
          message: data.message || "게시글을 불러오는데 실패했습니다.",
        };
      }
    } catch (error) {
      console.error("getPost error:", error);
      return {
        success: false,
        message: "네트워크 오류가 발생했습니다.",
      };
    }
  },

  // 게시글 작성
  createPost: async (postData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/board/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });
      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: data.post,
        };
      } else {
        return {
          success: false,
          message: data.message || "게시글 작성에 실패했습니다.",
        };
      }
    } catch (error) {
      console.error("createPost error:", error);
      return {
        success: false,
        message: "네트워크 오류가 발생했습니다.",
      };
    }
  },

  // 게시글 좋아요
  likePost: async (postId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/board/posts/${postId}/like`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: data,
        };
      } else {
        return {
          success: false,
          message: data.message || "좋아요 처리에 실패했습니다.",
        };
      }
    } catch (error) {
      console.error("likePost error:", error);
      return {
        success: false,
        message: "네트워크 오류가 발생했습니다.",
      };
    }
  },

  // 댓글 목록 조회
  getComments: async (postId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/board/posts/${postId}/comments`
      );
      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: data.comments || [],
        };
      } else {
        return {
          success: false,
          message: data.message || "댓글을 불러오는데 실패했습니다.",
        };
      }
    } catch (error) {
      console.error("getComments error:", error);
      return {
        success: false,
        message: "네트워크 오류가 발생했습니다.",
      };
    }
  },

  // 댓글 작성
  createComment: async (postId, commentData) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/board/posts/${postId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(commentData),
        }
      );
      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: data.comment,
        };
      } else {
        return {
          success: false,
          message: data.message || "댓글 작성에 실패했습니다.",
        };
      }
    } catch (error) {
      console.error("createComment error:", error);
      return {
        success: false,
        message: "네트워크 오류가 발생했습니다.",
      };
    }
  },

  // 댓글 좋아요
  likeComment: async (commentId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/board/comments/${commentId}/like`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: data,
        };
      } else {
        return {
          success: false,
          message: data.message || "좋아요 처리에 실패했습니다.",
        };
      }
    } catch (error) {
      console.error("likeComment error:", error);
      return {
        success: false,
        message: "네트워크 오류가 발생했습니다.",
      };
    }
  },
};
