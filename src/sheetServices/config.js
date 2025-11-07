// sheetServices/config.js

/**
 * Google Sheets 서비스 패키지 설정
 * 이 설정은 패키지를 다른 프로젝트에서 사용할 때 덮어쓸 수 있습니다.
 */

// 기본 Google Sheets API 설정
export const DEFAULT_SHEETS_CONFIG = {
    // API 관련 설정
    api: {
        baseUrl: 'https://sheets.googleapis.com/v4/spreadsheets',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scope: 'https://www.googleapis.com/auth/spreadsheets'
    }
};

// 기본 요청 옵션
export const DEFAULT_REQUEST_OPTIONS = {
    valueRenderOption: 'FORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING'
};

/**
 * 서비스 계정 자격 증명을 환경 변수에서 파싱
 * @param {string} envVar - 환경 변수명 (기본값: 'VITE_SERVICE_ACCOUNT_CREDENTIALS')
 * @returns {Object} 파싱된 서비스 계정 자격 증명
 */
export function parseServiceAccountCredentials(envVar = 'VITE_SERVICE_ACCOUNT_CREDENTIALS') {
    if (typeof window !== 'undefined') {
        // 브라우저 환경 (Vite 등)
        const credentials = import.meta.env?.[envVar];
        if (!credentials) {
            throw new Error(`Environment variable ${envVar} is not set`);
        }
        return JSON.parse(credentials);
    } else {
        // Node.js 환경
        const credentials = process.env[envVar];
        if (!credentials) {
            throw new Error(`Environment variable ${envVar} is not set`);
        }
        return JSON.parse(credentials);
    }
}

/**
 * 스프레드시트별 설정 생성 헬퍼
 * @param {Object} options - 설정 옵션
 * @param {string} options.spreadsheetId - 스프레드시트 ID
 * @param {string} options.sheetName - 시트명 (기본값: 'Sheet1')
 * @param {string} options.range - 데이터 범위 (기본값: 'A1:Z1000')
 * @returns {Object} 완전한 시트 설정 객체
 */
export function createSheetConfig({
    spreadsheetId,
    sheetName = 'Sheet1',
    range = 'A1:Z1000'
}) {
    if (!spreadsheetId) {
        throw new Error('spreadsheetId is required');
    }

    return {
        spreadsheetId,
        sheetName,
        range,
        ...DEFAULT_SHEETS_CONFIG
    };
}

/**
 * 설정 유효성 검사
 * @param {Object} config - 검사할 설정 객체
 * @throws {Error} 유효하지 않은 설정인 경우
 */
export function validateConfig(config) {
    if (!config) {
        throw new Error('Configuration is required');
    }

    if (!config.spreadsheetId) {
        throw new Error('spreadsheetId is required in configuration');
    }

    if (!config.sheetName) {
        throw new Error('sheetName is required in configuration');
    }

    if (!config.range) {
        throw new Error('range is required in configuration');
    }

    if (!config.api || !config.api.baseUrl || !config.api.tokenUrl || !config.api.scope) {
        throw new Error('Complete API configuration (baseUrl, tokenUrl, scope) is required');
    }
}