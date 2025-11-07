import {useState, useEffect} from 'react';
import {getSheetDataService} from '../services/sheetDataService';

function MyManito() {
    const [dataService] = useState(() => getSheetDataService());
    const [pairs, setPairs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchName, setSearchName] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [foundReceiver, setFoundReceiver] = useState(null);
    const [showResult, setShowResult] = useState(false);

    // 초기 데이터 로드
    useEffect(() => {
        loadPairData();
    }, []);

    // 쌍 데이터 로드 함수
    const loadPairData = async () => {
        try {
            setLoading(true);
            setError(null);

            // 서비스 초기화
            await dataService.initialize(
                '1IbHBh5SACa505qLB6eNZEARwRofDme_p1NmyRCL7xPA',
                'DB'
            );

            // J4:K1000 범위에서 쌍 데이터 가져오기
            const batchData = await dataService.sheetsService.getBatchData([
                'DB!J4:K1000'
            ]);

            const rawPairs = batchData['DB!J4:K1000'] || [];

            // 빈 값 필터링하고 유효한 쌍만 추출
            const validPairs = rawPairs
                .filter(row =>
                    Array.isArray(row) &&
                    row.length >= 2 &&
                    row[0] && row[1] &&
                    typeof row[0] === 'string' &&
                    typeof row[1] === 'string' &&
                    row[0].trim() && row[1].trim()
                )
                .map(row => ({
                    giver: row[0].trim(),
                    receiver: row[1].trim()
                }));

            setPairs(validPairs);
            console.log(`✅ ${validPairs.length}개의 쌍 데이터를 로드했습니다.`);

        } catch (err) {
            console.error('쌍 데이터 로드 실패:', err);
            setError(`데이터 로드 실패: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // 검색 함수
    const handleSearch = async () => {
        const trimmedName = searchName.trim();

        if (!trimmedName) {
            setSearchError('이름을 입력해주세요.');
            return;
        }

        setSearching(true);
        setSearchError('');

        try {
            // 대소문자 구분 없이 검색
            const foundPair = pairs.find(pair =>
                pair.giver.toLowerCase() === trimmedName.toLowerCase()
            );

            if (foundPair) {
                setFoundReceiver(foundPair.receiver);
                setShowResult(true);
                console.log(`✅ ${trimmedName}님의 리시버를 찾았습니다: 
     ${foundPair.receiver}`);
            } else {
                setSearchError('해당 이름의 기버를 찾을 수 없습니다. 이름을 정확히 입력해주세요.');
            }
        } catch (err) {
            setSearchError('검색 중 오류가 발생했습니다.');
            console.error('검색 오류:', err);
        } finally {
            setSearching(false);
        }
    };

    // 엔터키 처리
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // 다시 검색하기
    const handleSearchAgain = () => {
        setShowResult(false);
        setFoundReceiver(null);
        setSearchName('');
        setSearchError('');
    };

    // 로딩 상태
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-100 to-pink-50 flex
     items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full
     text-center">
                    <div className="animate-spin text-6xl mb-6">🎁</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">데이터 로딩
                        중...</h2>
                    <p className="text-gray-600 leading-relaxed">마니또 쌍 정보를 가져오고
                        있습니다.</p>
                    <div className="mt-6">
                        <div className="bg-red-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-red-500 h-full rounded-full animate-pulse
     w-3/4"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 에러 상태
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-100 to-pink-50 flex
     items-center justify-center p-4 ">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full
     text-center">
                    <div className="text-6xl mb-6">⚠️</div>
                    <h2 className="text-2xl font-bold text-red-600 mb-4">오류 발생</h2>
                    <p className="text-gray-700 mb-6 leading-relaxed break-words">{error}</p>
                    <button
                        onClick={loadPairData}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6
     py-3 rounded-xl
                                      transition-all duration-300 shadow-md hover:shadow-lg
     transform hover:scale-105 w-full"
                    >
                        🔄 다시 시도
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-100 to-pink-50 p-4">
            <div className="max-w-md mx-auto pt-12">
                {!showResult ? (
                    // 검색 화면
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        {/* 제목과 아이콘 */}
                        <div className="mb-8">
                            <div className="text-6xl mb-4">🎯</div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                내 리시버 찾기
                            </h1>
                            <p className="text-gray-600 text-sm">
                                {pairs.length}개의 마니또 쌍이 준비되어 있습니다
                            </p>
                        </div>

                        {/* 검색 입력 */}
                        <div className="mb-6">
                            <label htmlFor="searchName" className="block text-sm
     font-semibold text-gray-700 mb-3 text-left">
                                나의 이름을 입력하세요
                            </label>
                            <input
                                id="searchName"
                                type="text"
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="예: 홍길동"
                                className="w-full px-4 py-4 border-2 border-gray-200
     rounded-xl text-center text-lg
                                              focus:border-red-400 focus:ring-2 focus:ring-red-100
      focus:outline-none
                                              transition-all duration-300"
                                disabled={searching}
                            />
                        </div>

                        {/* 에러 메시지 */}
                        {searchError && (
                            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg
     p-4">
                                <p className="text-red-700 text-sm font-medium flex
     items-center justify-center gap-2">
                                    <span>⚠️</span>
                                    {searchError}
                                </p>
                            </div>
                        )}

                        {/* 찾기 버튼 */}
                        <button
                            onClick={handleSearch}
                            disabled={searching || !searchName.trim()}
                            className={`w-full py-4 rounded-xl font-bold text-lg 
     transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                                searching || !searchName.trim()
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-red-1000 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white'
                            }`}
                        >
                            {searching ? (
                                <span className="flex items-center justify-center gap-2">
                                         <div className="animate-spin">🔍</div>
                                         검색 중...
                                     </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                         <span>🔍</span>
                                         찾기
                                     </span>
                            )}
                        </button>

                        {/* 안내 메시지 */}
                        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg
     p-4">
                            <p className="text-blue-700 text-sm flex items-start gap-2">
                                <span className="text-base">💡</span>
                                <span>
                                         정확한 이름을 입력해주세요. 대소문자는 구분하지 않습니다.
                                     </span>
                            </p>
                        </div>
                    </div>
                ) : (
                    // 결과 화면
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        {/* 성공 애니메이션과 결과 */}
                        <div className="mb-8">
                            <div className="text-8xl mb-6 animate-bounce">🎉</div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-6
     leading-relaxed">
                                나의 Receiver는<br/>
                                <span className="text-4xl font-black text-transparent
     bg-clip-text bg-gradient-to-r from-red-1000 to-pink-500">
                                         {foundReceiver}
                                     </span>
                                <br/>입니다!
                            </h1>
                        </div>

                        {/* 축하 메시지 */}
                        <div className="bg-gradient-to-r from-red-100 to-pink-50 border
     border-red-200 rounded-xl p-6 mb-8">
                            <div className="text-4xl mb-3">🎁</div>
                            <p className="text-gray-700 font-medium leading-relaxed">
                                축하합니다!<br/>
                                <strong>{foundReceiver}</strong>님에게<br/>
                                따뜻한 선물을 준비해보세요!
                            </p>
                        </div>

                        {/* 다시 검색하기 버튼 */}
                        <button
                            onClick={handleSearchAgain}
                            className="w-full bg-gray-500 hover:bg-gray-600 text-white
     font-semibold py-3 rounded-xl
                                          transition-all duration-300 shadow-md hover:shadow-lg
     transform hover:scale-105"
                        >
                                 <span className="flex items-center justify-center gap-2">
                                     <span>🔍</span>
                                     다시 검색하기
                                 </span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyManito;