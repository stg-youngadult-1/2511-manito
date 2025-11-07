// sheetServices/index.js

/**
 * Google Sheets 서비스 패키지 - 메인 엔트리 포인트
 *
 * 이 패키지는 Google Sheets API와 연동하여 스프레드시트 데이터를 조회, 수정하는
 * 핵심 기능을 제공합니다. 범용적으로 사용할 수 있도록 설계되었습니다.
 *
 * @author Google Sheets Service Package
 * @version 1.0.0
 */

import { parseServiceAccountCredentials, createSheetConfig, validateConfig } from './config.js';
import { createAuth } from './auth.js';
import { createDataService } from './data.js';

/**
 * 완전한 Google Sheets 서비스 인스턴스를 생성하는 팩토리 함수
 *
 * @param {Object} config - 시트 설정
 * @param {string} config.spreadsheetId - 스프레드시트 ID
 * @param {string} config.sheetName - 시트명
 * @param {string} config.range - 데이터 범위
 * @param {Object} credentials - 서비스 계정 자격 증명
 * @returns {Object} 완전한 서비스 인스턴스 객체
 *
 * @example
 * ```javascript
 * import { createGoogleSheetsService, parseServiceAccountCredentials } from './sheetServices';
 *
 * const credentials = parseServiceAccountCredentials('VITE_SERVICE_ACCOUNT_CREDENTIALS');
 * const config = {
 *   spreadsheetId: '1-gUVumU_3rU82Y1tY9cX9PUe10zJsMlDmw6chxc03nY',
 *   sheetName: 'Sheet1',
 *   range: 'A1:Z100'
 * };
 *
 * const sheetsService = createGoogleSheetsService(config, credentials);
 *
 * // 데이터 조회
 * const data = await sheetsService.getSheetData();
 *
 * // 셀 업데이트
 * await sheetsService.updateCell('A1', 'Hello World');
 *
 * // CAS를 사용한 안전한 셀 업데이트
 * await sheetsService.updateCellWithCAS('A1', 'New Value', 'Expected Current Value');
 * ```
 */
export function createGoogleSheetsService(config, credentials) {
    if (!config) {
        throw new Error('Configuration is required');
    }

    if (!credentials) {
        throw new Error('Service account credentials are required');
    }

    // 설정 검증
    validateConfig(config);

    // 인증 서비스 생성
    const auth = createAuth(config);

    // 데이터 서비스 생성
    const dataService = createDataService(auth, config);
    dataService.setCredentials(credentials);

    // 공개 API만 반환
    return {
        /**
         * 스프레드시트 데이터 조회
         * @param {string} spreadsheetId - 스프레드시트 ID (선택사항)
         * @param {string} sheetName - 시트명 (선택사항)
         * @param {string} range - 데이터 범위 (선택사항)
         * @returns {Promise<Array<Array<string>>>} 스프레드시트 데이터 배열
         */
        async getSheetData(spreadsheetId, sheetName, range) {
            return await dataService.getSheetData(spreadsheetId, sheetName, range);
        },

        /**
         * 특정 셀의 값 조회
         * @param {string} cellAddress - 셀 주소 (예: 'A1')
         * @param {string} spreadsheetId - 스프레드시트 ID (선택사항)
         * @param {string} sheetName - 시트명 (선택사항)
         * @returns {Promise<string>} 셀 값
         */
        async getCellValue(cellAddress, spreadsheetId, sheetName) {
            return await dataService.getCellValue(spreadsheetId, sheetName, cellAddress);
        },

        /**
         * 단일 셀 값 업데이트
         * @param {string} cellAddress - 셀 주소 (예: 'A1')
         * @param {string} value - 새로운 값
         * @param {string} spreadsheetId - 스프레드시트 ID (선택사항)
         * @param {string} sheetName - 시트명 (선택사항)
         * @returns {Promise<Object>} 업데이트 결과
         */
        async updateCell(cellAddress, value, spreadsheetId, sheetName) {
            return await dataService.updateCell(spreadsheetId, sheetName, cellAddress, value);
        },

        /**
         * CAS (Compare-And-Swap)를 사용한 안전한 셀 업데이트
         * @param {string} cellAddress - 셀 주소 (예: 'A1')
         * @param {string} newValue - 새로운 값
         * @param {string} expectedValue - 예상되는 현재 값
         * @param {string} spreadsheetId - 스프레드시트 ID (선택사항)
         * @param {string} sheetName - 시트명 (선택사항)
         * @returns {Promise<Object>} 업데이트 결과
         */
        async updateCellWithCAS(cellAddress, newValue, expectedValue, spreadsheetId, sheetName) {
            return await dataService.updateCellWithCAS(spreadsheetId, sheetName, cellAddress, newValue, expectedValue);
        },

        /**
         * 여러 범위의 데이터를 한 번에 조회
         * @param {Array<string>} ranges - 범위 배열 (예: ['Sheet1!A1:C10', 'Sheet2!A1:B5'])
         * @param {string} spreadsheetId - 스프레드시트 ID (선택사항)
         * @returns {Promise<Object>} 범위별 데이터 객체
         */
        async getBatchData(ranges, spreadsheetId) {
            return await dataService.getBatchData(spreadsheetId, ranges);
        },

        /**
         * 스프레드시트 메타데이터 조회
         * @param {string} spreadsheetId - 스프레드시트 ID (선택사항)
         * @returns {Promise<Object>} 스프레드시트 메타데이터
         */
        async getSpreadsheetMetadata(spreadsheetId) {
            return await dataService.getSpreadsheetMetadata(spreadsheetId);
        },

        /**
         * 연결 상태 테스트
         * @returns {Promise<boolean>} 연결 성공 여부
         */
        async testConnection() {
            return await dataService.testConnection();
        },

        /**
         * 인증 수행
         * @returns {Promise<boolean>} 인증 성공 여부
         */
        async authenticate() {
            return await auth.authenticate(credentials);
        },

        /**
         * 설정 업데이트
         * @param {Object} newConfig - 새로운 설정
         */
        updateConfig(newConfig) {
            Object.assign(config, newConfig);
            auth.updateConfig(config);
            dataService.updateConfig(config);
        },

        /**
         * 자격 증명 업데이트
         * @param {Object} newCredentials - 새로운 자격 증명
         */
        updateCredentials(newCredentials) {
            dataService.setCredentials(newCredentials);
        },

        /**
         * 현재 설정 정보 조회
         * @returns {Object} 현재 설정
         */
        getConfig() {
            return { ...config };
        },

        /**
         * 인증 상태 확인
         * @returns {boolean} 인증된 상태인지 여부
         */
        isAuthenticated() {
            return auth.isAuthenticated();
        },

        /**
         * 인증 상태 정보 조회
         * @returns {Object} 인증 상태 정보
         */
        getAuthStatus() {
            return auth.getAuthStatus();
        }
    };
}

// React 훅들
export {
    useGoogleSheets,
    useSheetCell,
    useSheetBatch,
    useSheetMetadata,
    useSheetAuth
} from './hooks.js';

// 설정 유틸리티 함수들
export { parseServiceAccountCredentials, createSheetConfig, validateConfig };

/**
 * 기본 내보내기
 */
export default {
    createGoogleSheetsService,
    parseServiceAccountCredentials,
    createSheetConfig,
    validateConfig
};