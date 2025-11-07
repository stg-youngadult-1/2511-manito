import { useState, useEffect } from 'react';
import { getSheetDataService } from '../services/sheetDataService';

function SheetDataViewer() {
  const [dataService] = useState(() => getSheetDataService());
  const [data, setData] = useState({
    normals: [],
    newbies: [],
    leaders: [],
    filterPairs: [],
    metadata: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatedPairs, setGeneratedPairs] = useState(null);
  const [pairingInProgress, setPairingInProgress] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  // 데이터 로드 함수 (초기화 + 데이터 가져오기)
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await dataService.initializeAndFetch(
        '1IbHBh5SACa505qLB6eNZEARwRofDme_p1NmyRCL7xPA',
        'DB'
      );

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(`데이터 로드 실패: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 데이터 새로고침 함수
  const refreshData = async () => {
    if (!dataService.getInitializationStatus()) {
      await loadData(); // 초기화되지 않았다면 전체 로드
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const freshData = await dataService.fetchDefaultData('DB');
      setData(freshData);
    } catch (err) {
      setError(`새로고침 실패: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 랜덤 페어 생성 함수
  const generateRandomPairs = async () => {
    if (!data || (!data.normals.length && !data.newbies.length && !data.leaders.length)) {
      setError('참가자 데이터가 없습니다. 먼저 데이터를 로드해주세요.');
      return;
    }

    try {
      setPairingInProgress(true);
      setError(null);

      const pairResult = dataService.makeRandomPairs(data);
      setGeneratedPairs(pairResult);

      console.log('쌍 생성 완료:', pairResult);
    } catch (err) {
      setError(`쌍 생성 실패: ${err.message}`);
      console.error('쌍 생성 실패:', err);
    } finally {
      setPairingInProgress(false);
    }
  };


  // 에러 상태 UI
  if (error && !loading) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h2>오류</h2>
        <p>{error}</p>
        <button onClick={loadData} style={{ padding: '10px 20px', marginTop: '10px' }}>
          다시 시도
        </button>
        <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          환경 변수 VITE_SERVICE_ACCOUNT_CREDENTIALS가 올바르게 설정되었는지 확인해주세요.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Google Sheets 데이터 로딩 중...</h2>
        <p>스프레드시트에서 데이터를 가져오고 있습니다.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h2>데이터 로딩 오류</h2>
        <p>{error}</p>
        <button onClick={refetch}>재시도</button>
      </div>
    );
  }

  // 통계 정보 계산
  const statistics = data.metadata ? dataService.getDataStatistics(data) : null;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Google Sheets 데이터 뷰어</h1>
      <p>스프레드시트 ID: 1IbHBh5SACa505qLB6eNZEARwRofDme_p1NmyRCL7xPA</p>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
        <button
          onClick={refreshData}
          disabled={loading}
          style={{
            padding: '10px 20px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? '로딩 중...' : '데이터 새로고침'}
        </button>

        {statistics && (
          <div style={{
            backgroundColor: '#f0f0f0',
            padding: '10px 15px',
            borderRadius: '5px',
            fontSize: '14px'
          }}>
            <strong>통계:</strong> 총 {statistics.totalItems}개 항목, {statistics.totalPairs}개 페어
            {data.metadata?.fetchedAt && (
              <span style={{ marginLeft: '10px', color: '#666' }}>
                (마지막 업데이트: {new Date(data.metadata.fetchedAt).toLocaleString()})
              </span>
            )}
          </div>
        )}
      </div>

      {/* 랜덤 쌍 생성 버튼 */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <button
          onClick={generateRandomPairs}
          disabled={loading || pairingInProgress || (!data.normals.length && !data.newbies.length && !data.leaders.length)}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading || pairingInProgress ? 'not-allowed' : 'pointer',
            opacity: loading || pairingInProgress ? 0.6 : 1
          }}
        >
          {pairingInProgress ? '쌍 생성 중...' : '🎲 랜덤 쌍 생성'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Normals 섹션 */}
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
          <h3 style={{ color: '#2196F3', marginTop: 0 }}>Normals (A4:A)</h3>
          <p>총 {data.normals.length}개 항목</p>
          <div style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '3px' }}>
            {data.normals.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {data.normals.map((item, index) => (
                  <li key={index} style={{ marginBottom: '5px' }}>{item}</li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#666', fontStyle: 'italic' }}>데이터가 없습니다.</p>
            )}
          </div>
        </div>

        {/* Newbies 섹션 */}
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
          <h3 style={{ color: '#4CAF50', marginTop: 0 }}>Newbies (B4:B)</h3>
          <p>총 {data.newbies.length}개 항목</p>
          <div style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '3px' }}>
            {data.newbies.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {data.newbies.map((item, index) => (
                  <li key={index} style={{ marginBottom: '5px' }}>{item}</li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#666', fontStyle: 'italic' }}>데이터가 없습니다.</p>
            )}
          </div>
        </div>

        {/* Leaders 섹션 */}
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
          <h3 style={{ color: '#FF9800', marginTop: 0 }}>Leaders (C4:C)</h3>
          <p>총 {data.leaders.length}개 항목</p>
          <div style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '3px' }}>
            {data.leaders.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {data.leaders.map((item, index) => (
                  <li key={index} style={{ marginBottom: '5px' }}>{item}</li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#666', fontStyle: 'italic' }}>데이터가 없습니다.</p>
            )}
          </div>
        </div>
      </div>

      {/* Filter Pairs 섹션 */}
      <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
        <h3 style={{ color: '#9C27B0', marginTop: 0 }}>Filter Pairs (G4:H40)</h3>
        <p>총 {data.filterPairs.length}개 페어</p>
        <div style={{ maxHeight: '300px', overflowY: 'auto', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '3px' }}>
          {data.filterPairs.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#e0e0e0' }}>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>Column G</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>Column H</th>
                </tr>
              </thead>
              <tbody>
                {data.filterPairs.map((pair, index) => (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{pair[0]}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{pair[1]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#666', fontStyle: 'italic' }}>데이터가 없습니다.</p>
          )}
        </div>
      </div>

      {/* 생성된 랜덤 쌍 표시 */}
      {generatedPairs && (
        <div style={{ marginTop: '30px', border: '2px solid #4CAF50', padding: '20px', borderRadius: '10px' }}>
          <h2 style={{ color: '#4CAF50', marginTop: 0, textAlign: 'center' }}>
            🎯 생성된 랜덤 쌍 ({generatedPairs.pairs.length}개)
          </h2>

          {/* 쌍 생성 정보 */}
          <div style={{
            backgroundColor: '#e8f5e8',
            padding: '15px',
            borderRadius: '5px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <span><strong>총 참가자:</strong> {generatedPairs.metadata.totalParticipants}명</span>
              <span><strong>페어 참여:</strong> {generatedPairs.metadata.usedParticipants}명</span>
              {generatedPairs.metadata.excludedParticipants > 0 && (
                <span style={{ color: '#ff9800' }}>
                  <strong>제외:</strong> {generatedPairs.metadata.excludedParticipants}명
                </span>
              )}
              <span><strong>생성 시간:</strong> {new Date(generatedPairs.metadata.generatedAt).toLocaleString()}</span>
            </div>

            {generatedPairs.metadata.excluded.length > 0 && (
              <div style={{ marginTop: '10px', color: '#ff9800' }}>
                <strong>제외된 참가자:</strong> {generatedPairs.metadata.excluded.map(p => `${p.name} (${p.type})`).join(', ')}
              </div>
            )}
          </div>

          {/* 쌍 목록 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
            {generatedPairs.pairs.map((pair, index) => (
              <div
                key={pair.id}
                style={{
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                  쌍 #{pair.id}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{
                      backgroundColor: '#2196F3',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      marginBottom: '5px'
                    }}>
                      GIVER
                    </div>
                    <div style={{ fontWeight: 'bold' }}>{pair.giver}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>({pair.giverType})</div>
                  </div>
                  <div style={{ fontSize: '24px', color: '#4CAF50' }}>➡️</div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{
                      backgroundColor: '#FF9800',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      marginBottom: '5px'
                    }}>
                      RECEIVER
                    </div>
                    <div style={{ fontWeight: 'bold' }}>{pair.receiver}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>({pair.receiverType})</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 새로운 쌍 생성 버튼 */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              onClick={generateRandomPairs}
              disabled={pairingInProgress}
              style={{
                padding: '10px 20px',
                backgroundColor: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: pairingInProgress ? 'not-allowed' : 'pointer',
                opacity: pairingInProgress ? 0.6 : 1
              }}
            >
              🔄 새로운 쌍 다시 생성
            </button>
          </div>
        </div>
      )}

      {/* 원시 데이터 표시 (디버깅용) */}
      <details style={{ marginTop: '20px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>원시 배치 데이터 보기</summary>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', overflow: 'auto', fontSize: '12px' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export default SheetDataViewer;