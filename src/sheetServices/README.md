# Google Sheets Service Package

`ver 1.0.0`

Google Sheets API와 연동하여 스프레드시트 데이터를 조회, 수정하는 범용적인 서비스 패키지입니다. 브라우저 환경에서 JWT 기반 서비스 계정 인증을 지원하며, 동시성 제어를 위한 CAS(Compare-And-Swap) 패턴을 제공합니다.

## 특징

- 🔐 **JWT 기반 서비스 계정 인증** - 브라우저 환경에서 안전한 인증
- 📊 **완전한 CRUD 작업** - 데이터 조회, 셀 업데이트, 배치 처리
- 🔄 **CAS 패턴 지원** - Compare-And-Swap을 통한 동시성 제어
- 🛡️ **타입 안전성** - JSDoc을 통한 타입 힌트 제공
- 📦 **독립적 패키지** - 다른 프로젝트에서 쉽게 재사용 가능
- 🚫 **도메인 독립적** - 특정 도메인에 종속되지 않는 범용 설계

## 설치 및 설정

### 1. 환경 변수 설정

`.env` 파일에 Google 서비스 계정 자격 증명을 설정하세요:

```bash
VITE_SERVICE_ACCOUNT_CREDENTIALS='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

### 2. Google Sheets 권한 설정

1. Google Cloud Console에서 서비스 계정 생성
2. Sheets API 활성화
3. 서비스 계정 이메일을 스프레드시트에 공유 (편집 권한)

## 기본 사용법

### 서비스 인스턴스 생성

```javascript
import {
  createGoogleSheetsService,
  parseServiceAccountCredentials,
  createSheetConfig
} from './sheetServices';

// 환경 변수에서 자격 증명 파싱
const credentials = parseServiceAccountCredentials('VITE_SERVICE_ACCOUNT_CREDENTIALS');

// 시트 설정 생성
const config = createSheetConfig({
  spreadsheetId: '1-gUVumU_3rU82Y1tY9cX9PUe10zJsMlDmw6chxc03nY',
  sheetName: 'Sheet1',
  range: 'A1:Z100'
});

// 서비스 인스턴스 생성
const sheetsService = createGoogleSheetsService(config, credentials);

// 연결 테스트
const isConnected = await sheetsService.testConnection();
console.log('연결 상태:', isConnected);
```

### 기본 데이터 조회

```javascript
// 전체 시트 데이터 조회
const allData = await sheetsService.getSheetData();
console.log('전체 데이터:', allData);

// 특정 범위 데이터 조회
const rangeData = await sheetsService.getSheetData(
  '1-gUVumU_3rU82Y1tY9cX9PUe10zJsMlDmw6chxc03nY',
  'Sheet1',
  'A1:C10'
);

// 특정 셀 값 조회
const cellValue = await sheetsService.getCellValue('A1');
console.log('A1 셀 값:', cellValue);
```

### 데이터 업데이트

```javascript
// 단순 셀 업데이트
await sheetsService.updateCell('A1', 'Hello World');

// CAS를 사용한 안전한 업데이트 (동시성 제어)
try {
  await sheetsService.updateCellWithCAS('A1', 'New Value', 'Expected Current Value');
  console.log('업데이트 성공');
} catch (error) {
  if (error.message.includes('CONFLICT:')) {
    console.log('다른 사용자가 동시에 수정했습니다.');
  }
}
```

### 배치 데이터 처리

```javascript
// 여러 범위 동시 조회
const batchData = await sheetsService.getBatchData([
  'Sheet1!A1:C10',
  'Sheet1!E1:G10',
  'Sheet2!A1:B5'
]);

console.log('배치 데이터:', batchData);
// 결과: { 'Sheet1!A1:C10': [[...]], 'Sheet1!E1:G10': [[...]], ... }
```

### 메타데이터 조회

```javascript
// 스프레드시트 정보 조회
const metadata = await sheetsService.getSpreadsheetMetadata();
console.log('시트 제목:', metadata.properties.title);
console.log('시트 목록:', metadata.sheets.map(sheet => sheet.properties.title));
```

## React 훅 사용법

이 패키지는 React 애플리케이션에서 Google Sheets를 쉽게 사용할 수 있도록 다양한 훅을 제공합니다.

### useGoogleSheets - 기본 데이터 관리

```javascript
import { createGoogleSheetsService, parseServiceAccountCredentials, useGoogleSheets } from './sheetServices';

function SheetDataComponent() {
  // 서비스 인스턴스 생성
  const credentials = parseServiceAccountCredentials();
  const config = { spreadsheetId: 'your-id', sheetName: 'Sheet1', range: 'A1:Z100' };
  const sheetsService = createGoogleSheetsService(config, credentials);

  // 훅 사용
  const {
    data,
    loading,
    error,
    refetch,
    refreshData,
    clearError,
    reset
  } = useGoogleSheets(sheetsService, {
    autoFetch: true,           // 자동으로 데이터 로드
    refetchInterval: 30000,    // 30초마다 자동 새로고침
    onSuccess: (data) => console.log('데이터 로드 성공:', data),
    onError: (error) => console.error('에러 발생:', error)
  });

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>에러: {error} <button onClick={refetch}>재시도</button></div>;

  return (
    <div>
      <button onClick={() => refetch()}>새로고침</button>
      <button onClick={() => refreshData()}>백그라운드 새로고침</button>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

### useSheetCell - 개별 셀 관리

```javascript
import { useSheetCell } from './sheetServices';

function CellEditor({ sheetsService }) {
  const {
    cellValue,
    loading,
    error,
    updating,
    refetch,
    updateValue,
    updateValueWithCAS
  } = useSheetCell(sheetsService, 'A1', {
    autoFetch: true,
    spreadsheetId: 'custom-id',  // 선택사항
    sheetName: 'custom-sheet'    // 선택사항
  });

  const handleUpdate = async () => {
    try {
      await updateValue('새로운 값');
      console.log('업데이트 성공');
    } catch (err) {
      console.error('업데이트 실패:', err);
    }
  };

  const handleCASUpdate = async () => {
    try {
      await updateValueWithCAS('새로운 값', cellValue); // 현재 값과 비교
      console.log('CAS 업데이트 성공');
    } catch (err) {
      console.error('CAS 업데이트 실패:', err);
    }
  };

  return (
    <div>
      <p>현재 값: {cellValue}</p>
      <button onClick={handleUpdate} disabled={updating}>
        {updating ? '업데이트 중...' : '값 변경'}
      </button>
      <button onClick={handleCASUpdate} disabled={updating}>
        CAS 업데이트
      </button>
    </div>
  );
}
```

### useSheetBatch - 배치 데이터 관리

```javascript
import { useSheetBatch } from './sheetServices';

function BatchDataViewer({ sheetsService }) {
  const {
    batchData,
    loading,
    error,
    refetch
  } = useSheetBatch(sheetsService, [
    'Sheet1!A1:C10',
    'Sheet1!E1:G10',
    'Sheet2!A1:B5'
  ], {
    autoFetch: true,
    spreadsheetId: 'custom-id'  // 선택사항
  });

  if (loading) return <div>배치 데이터 로딩 중...</div>;
  if (error) return <div>에러: {error}</div>;

  return (
    <div>
      <button onClick={refetch}>새로고침</button>
      {Object.entries(batchData).map(([range, data]) => (
        <div key={range}>
          <h3>{range}</h3>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      ))}
    </div>
  );
}
```

### useSheetMetadata - 메타데이터 관리

```javascript
import { useSheetMetadata } from './sheetServices';

function SheetInfoViewer({ sheetsService }) {
  const {
    metadata,
    loading,
    error,
    refetch,
    title,
    sheets
  } = useSheetMetadata(sheetsService, {
    autoFetch: true,
    spreadsheetId: 'custom-id'  // 선택사항
  });

  if (loading) return <div>메타데이터 로딩 중...</div>;
  if (error) return <div>에러: {error}</div>;

  return (
    <div>
      <h2>스프레드시트: {title}</h2>
      <button onClick={refetch}>새로고침</button>

      <h3>시트 목록:</h3>
      <ul>
        {sheets.map((sheet) => (
          <li key={sheet.sheetId}>
            {sheet.title} (ID: {sheet.sheetId}, 인덱스: {sheet.index})
          </li>
        ))}
      </ul>

      <details>
        <summary>전체 메타데이터</summary>
        <pre>{JSON.stringify(metadata, null, 2)}</pre>
      </details>
    </div>
  );
}
```

### useSheetAuth - 인증 상태 관리

```javascript
import { useSheetAuth } from './sheetServices';

function AuthStatusComponent({ sheetsService }) {
  const {
    authStatus,
    loading,
    error,
    isAuthenticated,
    hasToken,
    tokenTTL,
    authenticate,
    testConnection,
    updateAuthStatus
  } = useSheetAuth(sheetsService);

  const handleAuth = async () => {
    try {
      await authenticate();
      console.log('인증 성공');
    } catch (err) {
      console.error('인증 실패:', err);
    }
  };

  const handleTest = async () => {
    try {
      const result = await testConnection();
      console.log('연결 테스트:', result ? '성공' : '실패');
    } catch (err) {
      console.error('연결 테스트 실패:', err);
    }
  };

  return (
    <div>
      <h3>인증 상태</h3>
      <p>인증됨: {isAuthenticated ? '예' : '아니오'}</p>
      <p>토큰 보유: {hasToken ? '예' : '아니오'}</p>
      <p>토큰 TTL: {tokenTTL}초</p>

      <button onClick={handleAuth} disabled={loading}>
        {loading ? '인증 중...' : '인증하기'}
      </button>
      <button onClick={handleTest} disabled={loading}>
        연결 테스트
      </button>
      <button onClick={updateAuthStatus}>
        상태 새로고침
      </button>

      {error && <p style={{color: 'red'}}>에러: {error}</p>}

      <details>
        <summary>상세 인증 정보</summary>
        <pre>{JSON.stringify(authStatus, null, 2)}</pre>
      </details>
    </div>
  );
}
```

### 복합 사용 예제

```javascript
import {
  createGoogleSheetsService,
  parseServiceAccountCredentials,
  useGoogleSheets,
  useSheetAuth,
  useSheetMetadata
} from './sheetServices';

function CompleteSheetManager() {
  // 서비스 인스턴스 생성
  const credentials = parseServiceAccountCredentials();
  const config = {
    spreadsheetId: '1-gUVumU_3rU82Y1tY9cX9PUe10zJsMlDmw6chxc03nY',
    sheetName: 'Sheet1',
    range: 'A1:Z100'
  };
  const sheetsService = createGoogleSheetsService(config, credentials);

  // 여러 훅 조합 사용
  const auth = useSheetAuth(sheetsService);
  const metadata = useSheetMetadata(sheetsService);
  const sheetData = useGoogleSheets(sheetsService, {
    autoFetch: auth.isAuthenticated, // 인증된 경우에만 자동 로드
    refetchInterval: 60000, // 1분마다 새로고침
    onError: (error) => {
      console.error('데이터 로드 에러:', error);
    }
  });

  // 인증되지 않은 경우
  if (!auth.isAuthenticated) {
    return (
      <div>
        <h2>Google Sheets 인증 필요</h2>
        <button onClick={auth.authenticate}>
          {auth.loading ? '인증 중...' : '인증하기'}
        </button>
        {auth.error && <p style={{color: 'red'}}>{auth.error}</p>}
      </div>
    );
  }

  return (
    <div>
      <header>
        <h1>{metadata.title || '스프레드시트'}</h1>
        <div>
          <button onClick={sheetData.refetch}>새로고침</button>
          <button onClick={auth.testConnection}>연결 테스트</button>
          <span>토큰 TTL: {auth.tokenTTL}초</span>
        </div>
      </header>

      <main>
        {sheetData.loading && <p>데이터 로딩 중...</p>}
        {sheetData.error && (
          <div style={{color: 'red'}}>
            에러: {sheetData.error}
            <button onClick={sheetData.clearError}>에러 지우기</button>
          </div>
        )}

        {sheetData.data && (
          <div>
            <h3>데이터 ({sheetData.data.length}행)</h3>
            <table>
              <tbody>
                {sheetData.data.map((row, index) => (
                  <tr key={index}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <footer>
        <p>마지막 업데이트: {sheetData.lastFetch}</p>
        <details>
          <summary>시트 목록</summary>
          <ul>
            {metadata.sheets.map(sheet => (
              <li key={sheet.sheetId}>{sheet.title}</li>
            ))}
          </ul>
        </details>
      </footer>
    </div>
  );
}
```

## API 참조

### 주요 메서드

#### `createGoogleSheetsService(config, credentials)`

Google Sheets 서비스 인스턴스를 생성합니다.

**매개변수:**
- `config` (Object): 시트 설정
  - `spreadsheetId` (string): 스프레드시트 ID
  - `sheetName` (string): 시트명
  - `range` (string): 기본 데이터 범위
- `credentials` (Object): 서비스 계정 자격 증명

**반환값:** Google Sheets 서비스 인스턴스

#### `getSheetData(spreadsheetId?, sheetName?, range?)`

스프레드시트 데이터를 조회합니다.

**매개변수:**
- `spreadsheetId` (string, 선택사항): 스프레드시트 ID
- `sheetName` (string, 선택사항): 시트명
- `range` (string, 선택사항): 데이터 범위

**반환값:** `Promise<Array<Array<string>>>` - 2차원 배열 형태의 데이터

#### `getCellValue(cellAddress, spreadsheetId?, sheetName?)`

특정 셀의 값을 조회합니다.

**매개변수:**
- `cellAddress` (string): 셀 주소 (예: 'A1', 'B5')
- `spreadsheetId` (string, 선택사항): 스프레드시트 ID
- `sheetName` (string, 선택사항): 시트명

**반환값:** `Promise<string>` - 셀 값

#### `updateCell(cellAddress, value, spreadsheetId?, sheetName?)`

단일 셀의 값을 업데이트합니다.

**매개변수:**
- `cellAddress` (string): 셀 주소 (예: 'A1', 'B5')
- `value` (string): 새로운 값
- `spreadsheetId` (string, 선택사항): 스프레드시트 ID
- `sheetName` (string, 선택사항): 시트명

**반환값:** `Promise<Object>` - 업데이트 결과

#### `updateCellWithCAS(cellAddress, newValue, expectedValue, spreadsheetId?, sheetName?)`

CAS 패턴을 사용하여 안전하게 셀을 업데이트합니다.

**매개변수:**
- `cellAddress` (string): 셀 주소
- `newValue` (string): 새로운 값
- `expectedValue` (string): 예상되는 현재 값
- `spreadsheetId` (string, 선택사항): 스프레드시트 ID
- `sheetName` (string, 선택사항): 시트명

**반환값:** `Promise<Object>` - 업데이트 결과

**에러:** 현재 값이 예상 값과 다르면 `CONFLICT:` 에러를 발생시킵니다.

#### `getBatchData(ranges, spreadsheetId?)`

여러 범위의 데이터를 한 번에 조회합니다.

**매개변수:**
- `ranges` (Array<string>): 범위 배열 (예: ['Sheet1!A1:C10', 'Sheet2!A1:B5'])
- `spreadsheetId` (string, 선택사항): 스프레드시트 ID

**반환값:** `Promise<Object>` - 범위별 데이터 객체

### 설정 및 유틸리티 함수

#### `parseServiceAccountCredentials(envVar?)`

환경 변수에서 서비스 계정 자격 증명을 파싱합니다.

**매개변수:**
- `envVar` (string, 선택사항): 환경 변수명 (기본값: 'VITE_SERVICE_ACCOUNT_CREDENTIALS')

**반환값:** 파싱된 자격 증명 객체

#### `createSheetConfig(options)`

시트 설정 객체를 생성합니다.

**매개변수:**
- `options` (Object):
  - `spreadsheetId` (string): 스프레드시트 ID
  - `sheetName` (string, 기본값: 'Sheet1'): 시트명
  - `range` (string, 기본값: 'A1:Z1000'): 데이터 범위

**반환값:** 유효성이 검증된 설정 객체

#### `validateConfig(config)`

설정 객체의 유효성을 검사합니다.

**매개변수:**
- `config` (Object): 검사할 설정 객체

**에러:** 유효하지 않은 설정인 경우 에러를 발생시킵니다.

## 에러 처리

### CAS 충돌 처리

```javascript
try {
  await sheetsService.updateCellWithCAS('A1', 'New Value', 'Old Value');
} catch (error) {
  if (error.message.includes('CONFLICT:')) {
    console.log('동시성 충돌 발생:', error.message);
    // 현재 값을 다시 조회하고 재시도
    const currentValue = await sheetsService.getCellValue('A1');
    console.log('현재 값:', currentValue);
  } else {
    console.error('다른 에러:', error.message);
  }
}
```

### 인증 에러 처리

```javascript
try {
  const isAuthenticated = await sheetsService.authenticate();
  if (!isAuthenticated) {
    throw new Error('인증 실패');
  }
} catch (error) {
  console.error('인증 에러:', error.message);
  // 자격 증명을 확인하거나 재설정
}
```

### 네트워크 에러 처리

```javascript
try {
  const data = await sheetsService.getSheetData();
} catch (error) {
  if (error.message.includes('네트워크')) {
    console.log('네트워크 연결을 확인해주세요.');
  } else if (error.message.includes('권한')) {
    console.log('스프레드시트 접근 권한을 확인해주세요.');
  } else {
    console.error('알 수 없는 에러:', error.message);
  }
}
```

## 고급 사용법

### 동적 설정 변경

```javascript
// 런타임에 설정 변경
sheetsService.updateConfig({
  spreadsheetId: 'new-spreadsheet-id',
  sheetName: 'NewSheet',
  range: 'A1:D50'
});

// 자격 증명 변경
const newCredentials = parseServiceAccountCredentials('NEW_CREDENTIALS_VAR');
sheetsService.updateCredentials(newCredentials);
```

### 상태 모니터링

```javascript
// 인증 상태 확인
console.log('인증됨:', sheetsService.isAuthenticated());

// 상세 인증 정보
const authStatus = sheetsService.getAuthStatus();
console.log('토큰 TTL:', authStatus.tokenTTL, '초');

// 현재 설정 확인
const config = sheetsService.getConfig();
console.log('현재 설정:', config);
```

### 연결 상태 확인

```javascript
// 주기적 연결 상태 체크
setInterval(async () => {
  const isConnected = await sheetsService.testConnection();
  console.log('연결 상태:', isConnected ? '정상' : '연결 실패');
}, 30000); // 30초마다
```

## 성능 최적화

1. **배치 처리 사용**: 여러 범위 조회 시 `getBatchData()` 사용
2. **적절한 범위 설정**: 필요한 데이터만 포함하도록 범위 최적화
3. **CAS 패턴 활용**: 동시 편집이 많은 환경에서 충돌 최소화
4. **토큰 재사용**: 인증 토큰은 자동으로 관리되어 재사용됨

## 보안 고려사항

1. **환경 변수 관리**: 서비스 계정 키를 안전하게 저장
2. **권한 최소화**: 스프레드시트에 필요한 최소 권한만 부여
3. **HTTPS 사용**: 프로덕션 환경에서 HTTPS 강제
4. **토큰 관리**: 액세스 토큰의 자동 갱신 및 만료 처리

## 라이선스

이 패키지는 MIT 라이선스 하에 배포됩니다.