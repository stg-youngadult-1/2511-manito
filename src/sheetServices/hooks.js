// sheetServices/hooks.js

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Google Sheets 서비스를 사용하는 기본 훅
 * @param {Object} sheetsService - createGoogleSheetsService로 생성된 서비스 인스턴스
 * @param {Object} options - 옵션
 * @param {boolean} options.autoFetch - 컴포넌트 마운트 시 자동으로 데이터를 가져올지 여부 (기본값: true)
 * @param {number} options.refetchInterval - 자동 새로고침 간격 (밀리초, 0이면 비활성화)
 * @param {Function} options.onSuccess - 성공 콜백
 * @param {Function} options.onError - 에러 콜백
 * @returns {Object} 훅 반환값
 */
export function useGoogleSheets(sheetsService, options = {}) {
    if (!sheetsService) {
        throw new Error('sheetsService is required');
    }

    const {
        autoFetch = true,
        refetchInterval = 0,
        onSuccess,
        onError
    } = options;

    // 상태 관리
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastFetch, setLastFetch] = useState(null);

    // ref를 사용해서 최신 상태 추적
    const abortControllerRef = useRef(null);
    const intervalRef = useRef(null);

    /**
     * 에러 처리 헬퍼
     */
    const handleError = useCallback((err, context = '') => {
        const errorMessage = err?.message || '알 수 없는 오류가 발생했습니다.';
        const fullError = context ? `${context}: ${errorMessage}` : errorMessage;

        console.error('useGoogleSheets 에러:', fullError, err);
        setError(fullError);

        if (onError) {
            onError(fullError, err);
        }
    }, [onError]);

    /**
     * 성공 처리 헬퍼
     */
    const handleSuccess = useCallback((fetchedData) => {
        setData(fetchedData);
        setError(null);
        setLastFetch(new Date().toISOString());

        if (onSuccess) {
            onSuccess(fetchedData);
        }
    }, [onSuccess]);

    /**
     * 데이터 가져오기
     */
    const fetchData = useCallback(async (options = {}) => {
        // 이미 진행 중인 요청이 있으면 취소
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // 새로운 AbortController 생성
        abortControllerRef.current = new AbortController();

        const {
            showLoading = true,
            spreadsheetId,
            sheetName,
            range
        } = options;

        try {
            if (showLoading) {
                setLoading(true);
            }

            // 요청이 취소되었는지 확인
            if (abortControllerRef.current?.signal.aborted) {
                return null;
            }

            console.log('📊 데이터 가져오기 시작');

            // 데이터 조회
            const result = await sheetsService.getSheetData(spreadsheetId, sheetName, range);

            // 요청이 취소되었는지 다시 확인
            if (abortControllerRef.current?.signal.aborted) {
                return null;
            }

            handleSuccess(result);
            console.log('✅ 데이터 가져오기 완료');
            return result;

        } catch (err) {
            // AbortError는 무시
            if (err.name === 'AbortError') {
                console.log('📝 데이터 가져오기 요청이 취소됨');
                return null;
            }

            handleError(err, '데이터 가져오기 실패');
            return null;
        } finally {
            if (showLoading) {
                setLoading(false);
            }
            abortControllerRef.current = null;
        }
    }, [sheetsService, handleError, handleSuccess]);

    /**
     * 데이터 새로고침 (로딩 상태 표시)
     */
    const refetch = useCallback((options = {}) => {
        return fetchData({ showLoading: true, ...options });
    }, [fetchData]);

    /**
     * 백그라운드에서 데이터 새로고침 (로딩 상태 표시 안함)
     */
    const refreshData = useCallback((options = {}) => {
        return fetchData({ showLoading: false, ...options });
    }, [fetchData]);

    /**
     * 에러 상태 초기화
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    /**
     * 모든 상태 초기화
     */
    const reset = useCallback(() => {
        // 진행 중인 요청 취소
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // 자동 새로고침 정지
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // 상태 초기화
        setData(null);
        setLoading(false);
        setError(null);
        setLastFetch(null);
    }, []);

    // 컴포넌트 마운트 시 자동 데이터 가져오기
    useEffect(() => {
        if (autoFetch) {
            fetchData();
        }

        // 자동 새로고침 설정
        if (refetchInterval > 0) {
            intervalRef.current = setInterval(() => {
                refreshData();
            }, refetchInterval);
        }

        // 클린업 함수
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [autoFetch, refetchInterval, fetchData, refreshData]);

    // 컴포넌트 언마운트 시 정리
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    // 반환값
    return {
        // 데이터 상태
        data,
        loading,
        error,
        lastFetch,

        // 메서드
        refetch,
        refreshData,
        clearError,
        reset,

        // 서비스 메서드들
        sheetsService
    };
}

/**
 * 특정 셀의 값을 관리하는 훅
 * @param {Object} sheetsService - createGoogleSheetsService로 생성된 서비스 인스턴스
 * @param {string} cellAddress - 셀 주소 (예: 'A1')
 * @param {Object} options - 옵션
 * @param {string} options.spreadsheetId - 스프레드시트 ID (선택사항)
 * @param {string} options.sheetName - 시트명 (선택사항)
 * @param {boolean} options.autoFetch - 자동으로 값을 가져올지 여부 (기본값: true)
 * @returns {Object} 훅 반환값
 */
export function useSheetCell(sheetsService, cellAddress, options = {}) {
    if (!sheetsService) {
        throw new Error('sheetsService is required');
    }

    if (!cellAddress) {
        throw new Error('cellAddress is required');
    }

    const {
        spreadsheetId,
        sheetName,
        autoFetch = true
    } = options;

    const [cellValue, setCellValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [updating, setUpdating] = useState(false);

    const fetchCellValue = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const value = await sheetsService.getCellValue(cellAddress, spreadsheetId, sheetName);
            setCellValue(value);

        } catch (err) {
            setError(err.message);
            console.error('셀 값 가져오기 실패:', err);
        } finally {
            setLoading(false);
        }
    }, [sheetsService, cellAddress, spreadsheetId, sheetName]);

    const updateCellValue = useCallback(async (newValue) => {
        try {
            setUpdating(true);
            setError(null);

            await sheetsService.updateCell(cellAddress, newValue, spreadsheetId, sheetName);
            setCellValue(newValue);

        } catch (err) {
            setError(err.message);
            console.error('셀 값 업데이트 실패:', err);
            throw err;
        } finally {
            setUpdating(false);
        }
    }, [sheetsService, cellAddress, spreadsheetId, sheetName]);

    const updateCellValueWithCAS = useCallback(async (newValue, expectedValue) => {
        try {
            setUpdating(true);
            setError(null);

            await sheetsService.updateCellWithCAS(cellAddress, newValue, expectedValue, spreadsheetId, sheetName);
            setCellValue(newValue);

        } catch (err) {
            setError(err.message);
            console.error('CAS 셀 값 업데이트 실패:', err);
            throw err;
        } finally {
            setUpdating(false);
        }
    }, [sheetsService, cellAddress, spreadsheetId, sheetName]);

    useEffect(() => {
        if (autoFetch) {
            fetchCellValue();
        }
    }, [autoFetch, fetchCellValue]);

    return {
        cellValue,
        loading,
        error,
        updating,
        refetch: fetchCellValue,
        updateValue: updateCellValue,
        updateValueWithCAS: updateCellValueWithCAS
    };
}

/**
 * 여러 범위의 데이터를 한 번에 관리하는 훅
 * @param {Object} sheetsService - createGoogleSheetsService로 생성된 서비스 인스턴스
 * @param {Array<string>} ranges - 범위 배열 (예: ['Sheet1!A1:C10', 'Sheet2!A1:B5'])
 * @param {Object} options - 옵션
 * @param {string} options.spreadsheetId - 스프레드시트 ID (선택사항)
 * @param {boolean} options.autoFetch - 자동으로 데이터를 가져올지 여부 (기본값: true)
 * @returns {Object} 훅 반환값
 */
export function useSheetBatch(sheetsService, ranges, options = {}) {
    if (!sheetsService) {
        throw new Error('sheetsService is required');
    }

    const {
        spreadsheetId,
        autoFetch = true
    } = options;

    const [batchData, setBatchData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchBatchData = useCallback(async () => {
        if (!ranges || ranges.length === 0) return;

        try {
            setLoading(true);
            setError(null);

            const data = await sheetsService.getBatchData(ranges, spreadsheetId);
            setBatchData(data);

        } catch (err) {
            setError(err.message);
            console.error('배치 데이터 가져오기 실패:', err);
        } finally {
            setLoading(false);
        }
    }, [sheetsService, ranges, spreadsheetId]);

    useEffect(() => {
        if (autoFetch && ranges && ranges.length > 0) {
            fetchBatchData();
        }
    }, [autoFetch, ranges, fetchBatchData]);

    return {
        batchData,
        loading,
        error,
        refetch: fetchBatchData
    };
}

/**
 * 스프레드시트 메타데이터를 관리하는 훅
 * @param {Object} sheetsService - createGoogleSheetsService로 생성된 서비스 인스턴스
 * @param {Object} options - 옵션
 * @param {string} options.spreadsheetId - 스프레드시트 ID (선택사항)
 * @param {boolean} options.autoFetch - 자동으로 데이터를 가져올지 여부 (기본값: true)
 * @returns {Object} 훅 반환값
 */
export function useSheetMetadata(sheetsService, options = {}) {
    if (!sheetsService) {
        throw new Error('sheetsService is required');
    }

    const {
        spreadsheetId,
        autoFetch = true
    } = options;

    const [metadata, setMetadata] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchMetadata = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await sheetsService.getSpreadsheetMetadata(spreadsheetId);
            setMetadata(data);

        } catch (err) {
            setError(err.message);
            console.error('메타데이터 가져오기 실패:', err);
        } finally {
            setLoading(false);
        }
    }, [sheetsService, spreadsheetId]);

    useEffect(() => {
        if (autoFetch) {
            fetchMetadata();
        }
    }, [autoFetch, fetchMetadata]);

    return {
        metadata,
        loading,
        error,
        refetch: fetchMetadata,
        // 편의 속성들
        title: metadata?.properties?.title,
        sheets: metadata?.sheets?.map(sheet => ({
            title: sheet.properties.title,
            sheetId: sheet.properties.sheetId,
            index: sheet.properties.index
        })) || []
    };
}

/**
 * 인증 상태를 관리하는 훅
 * @param {Object} sheetsService - createGoogleSheetsService로 생성된 서비스 인스턴스
 * @returns {Object} 훅 반환값
 */
export function useSheetAuth(sheetsService) {
    if (!sheetsService) {
        throw new Error('sheetsService is required');
    }

    const [authStatus, setAuthStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const updateAuthStatus = useCallback(() => {
        const status = sheetsService.getAuthStatus();
        setAuthStatus(status);
    }, [sheetsService]);

    const authenticate = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await sheetsService.authenticate();
            updateAuthStatus();
            return result;

        } catch (err) {
            setError(err.message);
            console.error('인증 실패:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [sheetsService, updateAuthStatus]);

    const testConnection = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await sheetsService.testConnection();
            updateAuthStatus();
            return result;

        } catch (err) {
            setError(err.message);
            console.error('연결 테스트 실패:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [sheetsService, updateAuthStatus]);

    // 마운트 시 인증 상태 확인
    useEffect(() => {
        updateAuthStatus();
    }, [updateAuthStatus]);

    return {
        authStatus,
        loading,
        error,
        isAuthenticated: authStatus?.isAuthenticated || false,
        hasToken: authStatus?.hasToken || false,
        tokenTTL: authStatus?.tokenTTL || 0,
        authenticate,
        testConnection,
        updateAuthStatus
    };
}