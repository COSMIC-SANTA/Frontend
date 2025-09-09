import { baseMountainName } from "@/utils/mountain";
import { useRouter } from "expo-router";
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { searchService } from "../services/api";
import BottomNavBar from "./s_navigationbar";

const SearchScreen = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchHistory, setSearchHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const router = useRouter();

    // 컴포넌트 마운트 시 검색 기록 불러오기
    useEffect(() => {
        loadSearchHistory();
    }, []);

    const loadSearchHistory = async () => {
        try {
            const history = await searchService.getSearchHistory();
            setSearchHistory(history);
        } catch (error) {
            console.error("검색 기록 불러오기 실패:", error);
        }
    };

    const handleNavigation = (screen) => {
        router.push(`/${screen}`);
    };

    // 검색 실행 함수
    const handleSearch = async () => {
        const trimmedQuery = searchQuery.trim();
        
        if (!trimmedQuery) {
            Alert.alert("알림", "검색어를 입력해주세요.");
            return;
        }

        setIsLoading(true);
        setShowResults(false);

        try {
            console.log(`검색 시작: "${trimmedQuery}"`);
            
            // API 호출
            const result = await searchService.searchMountain(trimmedQuery);
            
            if (result.success) {
                setSearchResults(result.data);
                setShowResults(true);
                
                // 검색 기록에 저장
                await searchService.saveSearchHistory(trimmedQuery);
                await loadSearchHistory(); // 검색 기록 새로고침
                
                console.log(`검색 완료: ${result.data.length}개 결과`);
                
                if (result.data.length === 0) {
                    Alert.alert("검색 결과", "검색된 산이 없습니다.");
                }
            } else {
                Alert.alert("검색 오류", result.error || "검색 중 오류가 발생했습니다.");
                setSearchResults([]);
            }
        } catch (error) {
            console.error("검색 실패:", error);
            Alert.alert("오류", "검색 중 문제가 발생했습니다.");
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    // 검색 기록 아이템 클릭
    const handleHistoryItemPress = (historyItem) => {
        setSearchQuery(historyItem);
    };

    // 검색 결과 아이템 클릭
    const handleResultItemPress = (mountain) => {
            console.log("선택된 산:", mountain);
            // 여기서 상세 페이지로 이동하거나 다른 액션 수행
            Alert.alert("산 선택", `${mountain.mountainName}을(를) 선택하시겠습니까?`,
            [
                { text: "취소", style: "cancel" },
                {
                    text: "완료",
                    onPress: async () => {
                    const location = mountain?.mountainAddress;
                    const mountainName = baseMountainName(mountain?.mountainName);
                        try {
                            console.log(`산 주소 정보 전달: ${mountain.mountainAddress}`);
                            if (location) {
                                router.push(`/mountain-tourism?mountainName=${encodeURIComponent(mountainName)}&location=${encodeURIComponent(location)}&pageNo=1`);
                            }
                        } catch (error) {
                            console.error("산 계획 페이지 전달 처리 오류:", error);
                            Alert.alert("오류", "산 주소를 전달하는 중 문제가 발생했습니다.");
                        }
                    }
                }
            ],
            { cancelable: true }
        );
    };

    // 검색 기록 삭제
    const clearHistory = async () => {
        Alert.alert(
            "검색 기록 삭제",
            "모든 검색 기록을 삭제하시겠습니까?",
            [
                { text: "취소", style: "cancel" },
                { 
                    text: "삭제", 
                    style: "destructive",
                    onPress: async () => {
                        await searchService.clearSearchHistory();
                        setSearchHistory([]);
                    }
                }
            ]
        );
    };

    // 검색 결과 렌더링
    const renderSearchResult = ({ item }) => (
        <TouchableOpacity 
            style={styles.resultItem}
            onPress={() => handleResultItemPress(item)}
        >
            <Text style={styles.mountainName}>{item.mountainName}</Text>
            <Text style={styles.mountainAddress}>{item.mountainAddress}</Text>
        </TouchableOpacity>
    );

    // 검색 기록 렌더링
    const renderHistoryItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.historyItem}
            onPress={() => handleHistoryItemPress(item)}
        >
            <Text style={styles.historyText}>{item}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.wrapper}>
            <View style={styles.container}>
                <Text style={styles.title}>찾고 싶은 산의 이름을 검색해주세요!</Text>
                
                {/* 검색 입력 영역 */}
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="산 이름을 입력하세요"
                        placeholderTextColor="#888"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                        editable={!isLoading}
                    />
                    <TouchableOpacity 
                        style={[styles.searchButton, isLoading && styles.searchButtonDisabled]}
                        onPress={handleSearch}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Text style={styles.searchButtonText}>검색</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* 검색 결과 표시 */}
                {showResults ? (
                    <View style={styles.resultsContainer}>
                        <Text style={styles.sectionTitle}>검색 결과 ({searchResults.length}개)</Text>
                        <FlatList
                            data={searchResults}
                            renderItem={renderSearchResult}
                            keyExtractor={(item, index) => `result-${index}`}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>검색된 산이 없습니다.</Text>
                            }
                        />
                    </View>
                ) : (
                    // 검색 기록 표시
                    searchHistory.length > 0 && (
                        <View style={styles.historyContainer}>
                            <View style={styles.historyHeader}>
                                <Text style={styles.sectionTitle}>최근 검색어</Text>
                                <TouchableOpacity onPress={clearHistory}>
                                    <Text style={styles.clearButton}>전체삭제</Text>
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={searchHistory}
                                renderItem={renderHistoryItem}
                                keyExtractor={(item, index) => `history-${index}`}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                            />
                        </View>
                    )
                )}
            </View>
            
            <BottomNavBar onNavigate={handleNavigation} />
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: '#325A2A',
    },
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        color: 'white',
        marginBottom: 30,
        textAlign: 'center',
        marginTop: 50,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    searchInput: {
        flex: 1,
        height: 50,
        backgroundColor: 'white',
        borderRadius: 25,
        paddingHorizontal: 20,
        fontSize: 16,
        marginRight: 10,
    },
    searchButton: {
        backgroundColor: '#1e4d1e',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderRadius: 25,
        minWidth: 70,
        alignItems: 'center',
    },
    searchButtonDisabled: {
        backgroundColor: '#666',
    },
    searchButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    resultsContainer: {
        flex: 1,
    },
    resultItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    mountainName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#325A2A',
        marginBottom: 5,
    },
    mountainAddress: {
        fontSize: 14,
        color: '#666',
    },
    historyContainer: {
        marginTop: 20,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    clearButton: {
        color: '#ffcccc',
        fontSize: 14,
    },
    historyItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
    },
    historyText: {
        color: 'white',
        fontSize: 14,
    },
    emptyText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 16,
        marginTop: 50,
    },
});

export default SearchScreen;