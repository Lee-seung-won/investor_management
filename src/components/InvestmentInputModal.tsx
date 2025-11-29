import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Input, Select, Button, message, Space, Row, Col, Card, Typography, Spin, Radio, DatePicker, List, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { Article } from '../types/index';
import { investmentsAPI, articlesAPI, fundsAPI, investorsAPI, otherActivitiesAPI } from '../services/api.ts';
import dayjs from 'dayjs';

const { Option } = Select;
const { Text } = Typography;

interface InvestmentInputModalProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (investmentData: any) => void;
  article: Article | null;
  investorName?: string;
  searchInvestorId?: number;
}

const InvestmentInputModal: React.FC<InvestmentInputModalProps> = ({
  visible,
  onCancel,
  onSave,
  article,
  investorName,
  searchInvestorId
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [scrapingContent, setScrapingContent] = useState(false);
  const [articleContent, setArticleContent] = useState(article?.content || '');
  const [investmentType, setInvestmentType] = useState<'investment' | 'fund' | 'others' | 'none'>('none');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualContent, setManualContent] = useState('');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [llmResult, setLlmResult] = useState<any>(null);
  const [showFundList, setShowFundList] = useState(false);
  const [investorFunds, setInvestorFunds] = useState<any[]>([]);
  const [loadingFunds, setLoadingFunds] = useState(false);
  const [articleInvestorName, setArticleInvestorName] = useState<string>('');

  // 숫자를 한글로 변환하는 함수
  const convertNumberToKorean = (num: string): string => {
    if (!num || num === '') return '';
    
    // 숫자만 추출 (쉼표, 공백 제거)
    const cleanNum = num.replace(/[,\s]/g, '');
    const number = parseInt(cleanNum);
    
    if (isNaN(number) || number === 0) return '';
    
    const units = ['', '만', '억', '조', '경'];
    const result = [];
    
    let unitIndex = 0;
    let remaining = number;
    
    while (remaining > 0 && unitIndex < units.length) {
      const currentUnit = remaining % 10000;
      if (currentUnit > 0) {
        if (currentUnit >= 1000) {
          const thousands = Math.floor(currentUnit / 1000);
          const hundreds = currentUnit % 1000;
          if (hundreds === 0) {
            result.unshift(`${thousands}천${units[unitIndex]}`);
          } else if (hundreds >= 100) {
            const hundredThousands = Math.floor(hundreds / 100);
            const tens = hundreds % 100;
            if (tens === 0) {
              result.unshift(`${thousands}천${hundredThousands}백${units[unitIndex]}`);
            } else if (tens >= 10) {
              const tenThousands = Math.floor(tens / 10);
              const ones = tens % 10;
              if (ones === 0) {
                result.unshift(`${thousands}천${hundredThousands}백${tenThousands}십${units[unitIndex]}`);
              } else {
                result.unshift(`${thousands}천${hundredThousands}백${tenThousands}십${ones}${units[unitIndex]}`);
              }
            } else {
              result.unshift(`${thousands}천${hundredThousands}백${tens}${units[unitIndex]}`);
            }
          } else if (hundreds >= 100) {
            const hundredThousands = Math.floor(hundreds / 100);
            const tens = hundreds % 100;
            if (tens === 0) {
              result.unshift(`${thousands}천${hundredThousands}백${units[unitIndex]}`);
            } else if (tens >= 10) {
              const tenThousands = Math.floor(tens / 10);
              const ones = tens % 10;
              if (ones === 0) {
                result.unshift(`${thousands}천${hundredThousands}백${tenThousands}십${units[unitIndex]}`);
              } else {
                result.unshift(`${thousands}천${hundredThousands}백${tenThousands}십${ones}${units[unitIndex]}`);
              }
            } else {
              result.unshift(`${thousands}천${hundredThousands}백${tens}${units[unitIndex]}`);
            }
          } else if (hundreds >= 10) {
            const tenThousands = Math.floor(hundreds / 10);
            const ones = hundreds % 10;
            if (ones === 0) {
              result.unshift(`${thousands}천${tenThousands}십${units[unitIndex]}`);
            } else {
              result.unshift(`${thousands}천${tenThousands}십${ones}${units[unitIndex]}`);
            }
          } else {
            result.unshift(`${thousands}천${hundreds}${units[unitIndex]}`);
          }
        } else if (currentUnit >= 100) {
          const hundreds = Math.floor(currentUnit / 100);
          const tens = currentUnit % 100;
          if (tens === 0) {
            result.unshift(`${hundreds}백${units[unitIndex]}`);
          } else if (tens >= 10) {
            const tenThousands = Math.floor(tens / 10);
            const ones = tens % 10;
            if (ones === 0) {
              result.unshift(`${hundreds}백${tenThousands}십${units[unitIndex]}`);
            } else {
              result.unshift(`${hundreds}백${tenThousands}십${ones}${units[unitIndex]}`);
            }
          } else {
            result.unshift(`${hundreds}백${tens}${units[unitIndex]}`);
          }
        } else if (currentUnit >= 10) {
          const tens = Math.floor(currentUnit / 10);
          const ones = currentUnit % 10;
          if (ones === 0) {
            result.unshift(`${tens}십${units[unitIndex]}`);
          } else {
            result.unshift(`${tens}십${ones}${units[unitIndex]}`);
          }
        } else {
          result.unshift(`${currentUnit}${units[unitIndex]}`);
        }
      }
      remaining = Math.floor(remaining / 10000);
      unitIndex++;
    }
    
    return result.join('');
  };

  // 투자 유형이 변경될 때 폼 초기화 및 LLM 분석 실행
  const handleInvestmentTypeChange = async (value: 'investment' | 'fund' | 'others' | 'none') => {
    setInvestmentType(value);
    form.resetFields();
    setAmountDisplay(''); // 한글 표시 초기화
    
    // 'none'이 아니고 기사 본문이 있으면 자동으로 LLM 분석 실행
    if (value !== 'none' && article?.id && articleContent && articleContent.trim()) {
      await handleLLMAnalyzeWithType(value);
    }
  };

  // 특정 유형으로 LLM 분석 실행
  const handleLLMAnalyzeWithType = async (type: 'investment' | 'fund' | 'others') => {
    if (!article?.id) {
      message.warning('기사 정보가 없습니다.');
      return;
    }

    if (!articleContent || !articleContent.trim()) {
      message.warning('기사 본문이 없습니다. 먼저 본문을 가져오세요.');
      return;
    }

    setAnalyzing(true);
    try {
      // force_type 매핑
      const forceTypeMap = {
        'investment': 'INVESTMENT',
        'fund': 'FUND',
        'others': 'OTHERS'
      };
      
      const response = await articlesAPI.analyzeArticle(article.id, forceTypeMap[type]);
      
      if (response.data.success && response.data.data) {
        const result = response.data.data;
        const isRelated = result.is_related !== undefined ? result.is_related : response.data.is_related_to_search_investor;
        
        // 강제 유형에 맞는 결과가 있으면 적용
        if (result.type === forceTypeMap[type]) {
          // 타입이 일치하면 is_related와 관계없이 적용 (사용자가 강제로 선택했으므로)
          setLlmResult(result);
          applyLLMResultToForm(result);
          if (isRelated) {
            message.success(`${type === 'investment' ? '투자 정보' : type === 'fund' ? '펀드 정보' : '기타 활동'} 정보를 추출했습니다.`);
          } else {
            message.info(`${type === 'investment' ? '투자 정보' : type === 'fund' ? '펀드 정보' : '기타 활동'} 정보를 찾았지만 관련성이 낮습니다. 확인 후 저장해주세요.`);
          }
        } else if (result.type === 'NONE') {
          // 정보를 찾지 못했지만, 사용자가 강제로 선택한 유형이므로 해당 폼을 활성화하고 수동 입력 가능하도록 함
          message.info(`${type === 'investment' ? '투자 정보' : type === 'fund' ? '펀드 정보' : '기타 활동'} 정보를 자동으로 찾지 못했습니다. 수동으로 입력해주세요.`);
          // LLM 결과는 저장하지 않고, 해당 유형의 폼만 활성화된 상태로 유지
        } else {
          // 다른 유형이 반환된 경우 - 하지만 사용자가 강제로 선택했으므로 해당 유형으로 처리
          // LLM이 다른 유형을 찾았어도, 사용자가 선택한 유형의 폼은 활성화되어 있으므로 수동 입력 가능
          message.warning(`LLM은 이 기사를 ${result.type === 'INVESTMENT' ? '투자 정보' : result.type === 'FUND' ? '펀드 정보' : '기타 활동'} 유형으로 분류했습니다. 원하시는 유형으로 수동 입력해주세요.`);
        }
      } else {
        message.error('기사 분석에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('LLM 분석 오류:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || '알 수 없는 오류';
      message.error(`기사 분석 중 오류가 발생했습니다: ${errorMessage}`);
    } finally {
      setAnalyzing(false);
    }
  };

  // 모달이 열릴 때 또는 article이 변경될 때 articleContent 초기화
  useEffect(() => {
    if (visible && article) {
      // 모달이 열릴 때마다 해당 기사의 content로 초기화
      // article.content가 null이거나 undefined일 때 빈 문자열로 처리
      const content = article.content || '';
      console.log(`모달 열림 - 기사 ID: ${article.id}, 본문 길이: ${content.length}`);
      setArticleContent(content);
      setShowManualInput(false);
      setManualContent('');
      setLlmResult(null); // LLM 결과도 초기화
      setShowFundList(false); // 펀드 목록 초기화
      setInvestorFunds([]); // 펀드 목록 데이터 초기화
    } else if (!visible) {
      // 모달이 닫힐 때 상태 초기화
      setArticleContent('');
      setShowManualInput(false);
      setManualContent('');
      setLlmResult(null);
      setShowFundList(false);
      setInvestorFunds([]);
    }
  }, [visible, article]);

  // 기사 본문 크롤링 함수
  const handleScrapeContent = async () => {
    if (!article?.id) return;
    
    setScrapingContent(true);
    try {
      const response = await articlesAPI.scrapeArticleContent(article.id);
      console.log('크롤링 응답:', response.data);
      
      if (response.data.success && response.data.saved) {
        // 크롤링 성공 및 저장 완료
        const scrapedContent = response.data.content || '';
        setArticleContent(scrapedContent);
        // article prop도 업데이트
        if (article) {
          article.content = scrapedContent;
        }
        setShowManualInput(false);
        message.success(`기사 본문이 성공적으로 가져와졌습니다. (${response.data.content_length || scrapedContent.length}자)`);
      } else if (response.data.success && !response.data.saved) {
        // 크롤링은 성공했지만 저장되지 않음 (기존 본문이 더 긴 경우)
        if (response.data.content) {
          setArticleContent(response.data.content);
          message.warning(response.data.message || '크롤링된 내용이 기존 본문보다 짧아 저장하지 않았습니다.');
        } else {
          message.warning(response.data.message || '크롤링에 실패했습니다.');
          setShowManualInput(true);
        }
      } else {
        // 크롤링 실패
        if (response.data.content && response.data.content.trim()) {
          // 크롤링된 내용이 있으면 표시 (저장은 안 됨)
          setArticleContent(response.data.content);
          message.warning(response.data.message || '크롤링에 실패했지만 일부 내용을 가져왔습니다.');
        } else {
          // 크롤링 실패, 본문 없음
          message.warning(response.data.message || '크롤링에 실패했습니다. 수동 입력을 사용하세요.');
          setShowManualInput(true);
        }
      }
    } catch (error: any) {
      console.error('Content scraping error:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || '알 수 없는 오류';
      message.error(`기사 본문 크롤링 중 오류가 발생했습니다: ${errorMessage}`);
      setShowManualInput(true);
    } finally {
      setScrapingContent(false);
    }
  };

  // 수동 본문 입력 함수
  const handleManualContentSubmit = async () => {
    if (!manualContent.trim()) {
      message.warning('본문을 입력해주세요.');
      return;
    }
    
    if (!article?.id) {
      message.error('기사 정보가 없습니다.');
      return;
    }
    
    try {
      // 데이터베이스에 본문 저장
      const response = await articlesAPI.updateArticleContent(article.id, manualContent);
      console.log('본문 저장 응답:', response.data);
      
      if (response.data && response.data.saved) {
        // 저장 성공
        setArticleContent(manualContent);
        setShowManualInput(false);
        setManualContent(''); // 수동 입력 필드 초기화
        
        // article prop도 업데이트 (부모 컴포넌트에 반영되도록)
        if (article) {
          article.content = manualContent;
        }
        
        message.success(`본문이 저장되었습니다. (${response.data.content_length || manualContent.length}자)`);
      } else {
        message.warning('본문 저장 응답을 확인할 수 없습니다.');
      }
    } catch (error: any) {
      console.error('본문 저장 중 오류:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || '알 수 없는 오류';
      message.error(`본문 저장에 실패했습니다: ${errorMessage}`);
    }
  };

  // 수동 입력 취소 함수
  const handleManualInputCancel = () => {
    setShowManualInput(false);
    setManualContent('');
  };

  // LLM으로 분석하기
  const handleLLMAnalyze = async () => {
    if (!article?.id) {
      message.warning('기사 정보가 없습니다.');
      return;
    }

    if (!articleContent || !articleContent.trim()) {
      message.warning('기사 본문이 없습니다. 먼저 본문을 가져오세요.');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await articlesAPI.analyzeArticle(article.id);
      
      if (response.data.success && response.data.data) {
        const result = response.data.data;
        // LLM이 판단한 관련성 사용 (result.is_related 또는 response.data.is_related_to_search_investor)
        const isRelated = result.is_related !== undefined ? result.is_related : response.data.is_related_to_search_investor;
        const searchInvestorName = response.data.search_investor_name;
        
        // 관련성 검증 (LLM이 판단한 결과 사용)
        // is_related가 false이거나 type이 "NONE"인 경우 자동으로 "상관없음" 처리
        if ((!isRelated || result.type === 'NONE') && response.data.search_investor_id) {
          // 검색 주체 투자자와 관련이 없으면 "상관없음" 처리
          setInvestmentType('none');
          setLlmResult(null);
          form.resetFields();
          message.warning(
            `이 기사는 검색 주체 투자자(${searchInvestorName})와 관련이 없습니다. "상관없음"으로 처리됩니다.`
          );
          return;
        }
        
        setLlmResult(result);
        
        // 결과를 폼에 자동 입력
        applyLLMResultToForm(result);
        
        message.success('LLM 분석이 완료되었습니다. 결과를 확인하고 저장해주세요.');
      } else {
        message.error('분석 결과를 가져올 수 없습니다.');
      }
    } catch (error: any) {
      console.error('LLM 분석 오류:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'LLM 분석 중 오류가 발생했습니다.';
      message.error(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  };

  // LLM 결과를 폼에 적용
  const applyLLMResultToForm = (result: any) => {
    if (result.type === 'FUND') {
      setInvestmentType('fund');
      form.setFieldsValue({
        fund_name: result.fund_name,
        fund_sector: result.fund_sector || ''
      });
      // 즉시 업데이트를 위해 약간의 지연 후 확인
      setTimeout(() => {
        const currentFundName = form.getFieldValue('fund_name');
        if (currentFundName !== result.fund_name) {
          form.setFieldsValue({ fund_name: result.fund_name });
        }
      }, 50);
    } else if (result.type === 'INVESTMENT') {
      setInvestmentType('investment');
      
      // startup_names와 investor_names 배열 처리 (하위 호환성: startup_name도 지원)
      let startupNames: string[] = [];
      if (result.startup_names && Array.isArray(result.startup_names)) {
        startupNames = result.startup_names;
      } else if (result.startup_name) {
        // 기존 형식 지원
        startupNames = [result.startup_name];
      }
      
      let investorNames: string[] = [];
      if (result.investor_names && Array.isArray(result.investor_names)) {
        investorNames = result.investor_names;
      } else if (result.investor_name) {
        // 기존 형식 지원
        investorNames = [result.investor_name];
      }
      
      // startup_sectors 배열 처리
      let startupSectors: string[] = [];
      if (result.startup_sectors && Array.isArray(result.startup_sectors)) {
        startupSectors = result.startup_sectors;
      } else if (result.startup_sector) {
        // 기존 형식 지원
        startupSectors = [result.startup_sector];
      }
      
      // startup_names와 startup_sectors 길이 맞추기
      if (startupSectors.length < startupNames.length) {
        const lastSector = startupSectors[startupSectors.length - 1] || '';
        while (startupSectors.length < startupNames.length) {
          startupSectors.push(lastSector);
        }
      }
      
      // 여러 스타트업인 경우 금액은 null
      let amountValue = '';
      let numAmount = 0;
      
      if (startupNames.length === 1 && result.total_amount !== null && result.total_amount !== undefined) {
        // 단일 스타트업인 경우에만 금액 처리
        if (typeof result.total_amount === 'number') {
          numAmount = result.total_amount;
        } else if (typeof result.total_amount === 'string') {
          const cleaned = result.total_amount.replace(/[^0-9]/g, '');
          numAmount = cleaned ? parseInt(cleaned, 10) : 0;
        }
        
        if (numAmount > 0) {
          amountValue = numAmount.toLocaleString('ko-KR');
        }
      }
      
      // 폼에 값 설정 (쉼표로 구분된 문자열)
      const formValues: any = {
        startup_name: startupNames.join(', '),
        investor_name: investorNames.length > 0 
          ? investorNames.join(', ') 
          : (form.getFieldValue('investor_name') || investorName || ''),
        sector: startupSectors.join(', '),
        round_type: result.round_stage || '',
        currency: 'KRW',
        investment_date: result.investment_date || '',
        news_summary: result.news_summary || '',
      };
      
      // amount 필드 추가 (단일 스타트업인 경우에만)
      if (amountValue && startupNames.length === 1) {
        formValues.amount = amountValue;
      }
      
      // 모든 값을 한 번에 설정
      form.setFieldsValue(formValues);
      
      // 강제로 리렌더링을 위해 약간의 지연 후 다시 설정
      setTimeout(() => {
        if (amountValue && startupNames.length === 1) {
          form.setFieldValue('amount', amountValue);
          const amountInput = document.querySelector('input[name="amount"]') as HTMLInputElement;
          if (amountInput && amountInput.value !== amountValue) {
            amountInput.value = amountValue;
            const event = new Event('input', { bubbles: true });
            amountInput.dispatchEvent(event);
          }
        }
      }, 50);
      
      // 금액 한글 표시 업데이트 (단일 스타트업인 경우에만)
      if (numAmount > 0 && startupNames.length === 1) {
        const koreanAmount = convertNumberToKorean(String(numAmount));
        setAmountDisplay(koreanAmount);
      } else {
        setAmountDisplay('');
      }
    } else if (result.type === 'OTHERS') {
      setInvestmentType('others');
      form.setFieldsValue({
        others_ac_name: result.ac_name,
        others_event_type: result.event_type,
        others_related_company: result.related_company || '',
        others_summary: result.summary,
        others_date: result.date ? dayjs(result.date) : null,
      });
    }
  };

  // 기사 본문을 문장 단위로 분할하는 함수
  const splitIntoSentences = (text: string): string[] => {
    if (!text) return [];
    
    // 문장 끝 패턴으로 분할 (., !, ?, ;, 줄바꿈)
    const sentences = text
      .split(/[.!?;]\s*|\n+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 5); // 너무 짧은 문장 제거
    
    return sentences;
  };

  // 모달이 열릴 때 투자사 이름 설정
  useEffect(() => {
    if (visible) {
      setAmountDisplay(''); // 한글 표시 초기화
      setLlmResult(null); // LLM 결과 초기화
      setShowFundList(false); // 펀드 목록 닫기
      setInvestorFunds([]); // 펀드 목록 초기화
      setInvestmentType('none'); // 처리 유형을 '상관없음'으로 초기화
      form.resetFields(); // 폼 초기화
      if (investorName) {
        form.setFieldsValue({ investor_name: investorName });
        setArticleInvestorName(investorName);
      } else if (searchInvestorId) {
        // searchInvestorId가 있으면 투자사 정보를 조회해서 설정
        fetchInvestorName(searchInvestorId);
      } else if (article?.search_investor_id) {
        // article의 search_investor_id로 투자사 정보 조회
        fetchInvestorName(article.search_investor_id);
      }
    }
  }, [visible, investorName, searchInvestorId, article?.search_investor_id, form]);

  // 투자사 ID로 투자사 이름 조회
  const fetchInvestorName = async (investorId: number) => {
    try {
      const response = await investorsAPI.getInvestor(investorId);
      if (response.data) {
        form.setFieldsValue({ investor_name: response.data.name });
        setArticleInvestorName(response.data.name);
      }
    } catch (error) {
      console.error('투자사 정보 조회 실패:', error);
    }
  };


  const handleSave = async () => {
    setLoading(true);

    try {
      if (investmentType === 'investment') {
        // 필수 필드 검증
        const values = await form.validateFields();
        
        if (!values.startup_name || !values.investor_name || !values.sector) {
          message.error('스타트업명, 투자사명, 섹터는 필수 입력 항목입니다.');
          return;
        }
        
        const investmentData = {
          article_id: article?.id,
          startup_name: values.startup_name,
          investor_name: values.investor_name,
          round_type: values.round_type || null,
          amount: values.amount ? String(values.amount).replace(/,/g, '') : null, // 천 단위 구분자 제거
          currency: values.currency || 'KRW',
          sector: values.sector,
          investment_date: values.investment_date ? 
            (typeof values.investment_date === 'string' ? values.investment_date : values.investment_date.format('YYYY-MM-DD')) : 
            null,
          extraction_method: 'manual',
          is_verified: true,
          is_correct: true,
          user_id: null
        };
        
        await investmentsAPI.createInvestment(investmentData);
        form.resetFields();
        message.success('투자 정보가 저장되었습니다.');
        onSave(investmentData);
      } else if (investmentType === 'fund') {
        const values = await form.validateFields();
        // LLM 결과에서 ac_name을 fund_manager로 사용 (2순위 investor_id 매칭용)
        const fundManager = llmResult?.ac_name || null;
        const fundData = {
          article_id: article?.id,
          fund_name: values.fund_name,
          fund_sector: values.fund_sector,
          fund_manager: fundManager,
          user_id: null
        };
        
        await fundsAPI.createFund(fundData);
        form.resetFields();
        message.success('펀드 정보가 저장되었습니다. 기사 처리가 완료되었습니다.');
        onSave(fundData);
      } else if (investmentType === 'others') {
        const values = await form.validateFields();
        
        if (!values.others_ac_name || !values.others_event_type || !values.others_summary) {
          message.error('AC 이름, 활동 종류, 활동 내용 요약은 필수 입력 항목입니다.');
          return;
        }
        
        const othersData = {
          article_id: article?.id,
          ac_name: values.others_ac_name,
          event_type: values.others_event_type,
          related_company: values.others_related_company || null,
          summary: values.others_summary,
          date: values.others_date ? 
            (typeof values.others_date === 'string' ? values.others_date : values.others_date.format('YYYY-MM-DD')) : 
            null,
          user_id: null
        };
        
        await otherActivitiesAPI.createOtherActivity(othersData);
        form.resetFields();
        message.success('기타 활동 정보가 저장되었습니다.');
        onSave(othersData);
      } else if (investmentType === 'none') {
        // 기사만 처리하고 별도 정보 저장하지 않음
        if (article?.id) {
          await articlesAPI.markArticleProcessed(article.id);
        }
        message.success('기사 처리가 완료되었습니다.');
        onSave({});
      }
    } catch (error) {
      console.error('Save error:', error);
      console.error('Error details:', error.response?.data || error.message);
      message.error(`정보 저장에 실패했습니다: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setLlmResult(null);
    onCancel();
  };

  return (
    <Modal
      title="정보 입력"
      open={visible}
      onCancel={handleCancel}
      width={1400}
      style={{ top: 20 }}
      bodyStyle={{ maxHeight: '80vh', overflow: 'auto' }}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          취소
        </Button>,
        <Button 
          key="save" 
          type="primary" 
          loading={loading} 
          onClick={handleSave}
        >
          {investmentType === 'none' ? '처리 완료' : 
           investmentType === 'others' ? '저장 (기타 활동)' : '저장'}
        </Button>,
      ]}
    >
      <Row gutter={24}>
        {/* 왼쪽: 기사 본문 */}
        <Col span={12}>
          {/* LLM 분석 완료 알림 */}
          {llmResult && (
            <Card 
              size="small" 
              style={{ 
                marginBottom: '16px',
                border: '2px solid #52c41a',
                backgroundColor: '#f6ffed'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong style={{ color: '#52c41a' }}>✅ LLM 분석 완료</Text>
                  <Text type="secondary" style={{ marginLeft: '8px', fontSize: '12px' }}>
                    ({llmResult.type === 'FUND' ? '펀드 정보' : 
                      llmResult.type === 'INVESTMENT' ? '투자 유치' : '기타'} - 아래 폼에 자동 입력되었습니다)
                  </Text>
                </div>
                <Button 
                  size="small" 
                  onClick={() => {
                    setLlmResult(null);
                    form.resetFields();
                    // investor_name은 유지
                    if (investorName) {
                      form.setFieldsValue({ investor_name: investorName });
                    }
                  }}
                >
                  초기화
                </Button>
              </div>
            </Card>
          )}
          
          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>기사 본문</span>
                <Space>
                  <Button 
                    size="small" 
                    type="primary" 
                    loading={scrapingContent}
                    onClick={handleScrapeContent}
                    disabled={!article?.id || showManualInput}
                  >
                    {scrapingContent ? '크롤링 중...' : '전체 본문 가져오기'}
                  </Button>
                  <Button 
                    size="small" 
                    onClick={() => setShowManualInput(true)}
                    disabled={showManualInput}
                  >
                    수동 입력
                  </Button>
                  <Button 
                    size="small" 
                    type="default"
                    loading={analyzing}
                    onClick={handleLLMAnalyze}
                    disabled={!article?.id || !articleContent || !articleContent.trim()}
                    style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: '#fff' }}
                  >
                    {analyzing ? '분석 중...' : '🤖 LLM으로 분석하기'}
                  </Button>
                  <Button 
                    size="small" 
                    onClick={() => window.open(article?.url, '_blank')}
                    disabled={!article?.url}
                  >
                    원문보기
                  </Button>
                </Space>
              </div>
            }
            size="small" 
            style={{ 
              height: '700px', 
              overflow: 'hidden',
              border: '1px solid #d9d9d9'
            }}
            bodyStyle={{ 
              padding: '12px', 
              height: 'calc(100% - 57px)', 
              overflow: 'auto',
              scrollbarWidth: 'thin'
            }}
          >
            {article && (
              <div>
                <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ flex: 1, marginRight: 16 }}>{article.title}</Text>
                    <Text type="secondary" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {new Date(article.published_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </Text>
                  </div>
                </div>
                <div style={{ lineHeight: '1.6', paddingBottom: '20px' }}>
                  {scrapingContent ? (
                    <div style={{ textAlign: 'center', padding: '50px 0' }}>
                      <Spin size="large" />
                      <div style={{ marginTop: 16 }}>기사 본문을 가져오는 중...</div>
                    </div>
                  ) : showManualInput ? (
                    <div style={{ padding: '20px 0' }}>
                      <div style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>
                        크롤링에 실패했습니다. 아래에 기사 본문을 직접 붙여넣어 주세요:
                      </div>
                      <Input.TextArea
                        value={manualContent}
                        onChange={(e) => setManualContent(e.target.value)}
                        placeholder="기사 본문을 여기에 붙여넣어 주세요..."
                        rows={15}
                        style={{ marginBottom: '16px' }}
                      />
                      <div style={{ textAlign: 'right' }}>
                        <Space>
                          <Button onClick={handleManualInputCancel}>
                            취소
                          </Button>
                          <Button type="primary" onClick={handleManualContentSubmit}>
                            적용
                          </Button>
                        </Space>
                      </div>
                    </div>
                  ) : (
                    articleContent ? (
                      splitIntoSentences(articleContent).map((sentence, index) => (
                        <div key={index} style={{ marginBottom: 8, padding: '4px 0', display: 'flex' }}>
                          <div style={{ 
                            minWidth: '24px', 
                            marginRight: '8px', 
                            color: '#666', 
                            fontSize: '12px',
                            textAlign: 'right',
                            paddingTop: '2px'
                          }}>
                            {index + 1}.
                          </div>
                          <div style={{ flex: 1 }}>
                            {sentence}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '50px 0', 
                        color: '#999',
                        fontSize: '14px'
                      }}>
                        기사 본문이 없습니다.<br />
                        "전체 본문 가져오기" 버튼을 클릭하여 본문을 가져오세요.
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </Card>
        </Col>
        
        {/* 오른쪽: 투자 정보 입력 폼 */}
        <Col span={12}>
          <Card 
            title={(() => {
              // 디버깅: article 객체 확인
              if (article) {
                console.log('🔍 InvestmentInputModal - article 객체:', {
                  id: article.id,
                  search_query: article.search_query,
                  search_investor_id: article.search_investor_id,
                  articleInvestorName: articleInvestorName
                });
              }
              
              if (articleInvestorName) {
                if (article?.search_query) {
                  return `처리유형선택 - ${articleInvestorName} (검색쿼리 - ${article.search_query})`;
                } else {
                  return `처리유형선택 - ${articleInvestorName}`;
                }
              } else {
                if (article?.search_query) {
                  return `처리유형선택 (검색쿼리 - ${article.search_query})`;
                } else {
                  return "처리유형선택";
                }
              }
            })()} 
            size="small" 
            style={{ marginBottom: '16px' }}
          >
            <Radio.Group 
              value={investmentType} 
              onChange={(e) => handleInvestmentTypeChange(e.target.value)}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio value="investment">
                  <div>
                    <div style={{ fontWeight: 'bold' }}>투자 정보</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>스타트업 투자 정보를 입력합니다</div>
                  </div>
                </Radio>
                <Radio value="fund">
                  <div>
                    <div style={{ fontWeight: 'bold' }}>펀드 정보</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>펀드 정보를 입력합니다</div>
                  </div>
                </Radio>
                <Radio value="others">
                  <div>
                    <div style={{ fontWeight: 'bold' }}>기타 활동</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>DemoDay, MOU, 파트너십, 투자금 회수 등 기타 활동 정보를 입력합니다</div>
                  </div>
                </Radio>
                <Radio value="none">
                  <div>
                    <div style={{ fontWeight: 'bold' }}>상관없음</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>기사만 처리하고 별도 정보를 입력하지 않습니다</div>
                  </div>
                </Radio>
              </Space>
            </Radio.Group>
          </Card>

          {investmentType === 'investment' && (
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                currency: 'KRW'
              }}
            >
        <Form.Item
          name="startup_name"
          label="스타트업 이름"
          rules={[{ required: true, message: '스타트업 이름을 입력해주세요.' }]}
        >
          <Input placeholder="스타트업 이름을 입력하세요" />
        </Form.Item>

        <Form.Item
          name="investor_name"
          label="투자사 이름"
          rules={[{ required: true, message: '투자사 이름을 입력해주세요.' }]}
        >
          <Input placeholder="투자사 이름을 입력하세요" />
        </Form.Item>

        <Form.Item
          name="round_type"
          label="투자 라운드 (선택사항)"
          rules={[{ required: false, message: '투자 라운드를 선택해주세요.' }]}
        >
          <Select placeholder="투자 라운드를 선택하세요">
            <Option value="시드">시드</Option>
            <Option value="시리즈A">시리즈A</Option>
            <Option value="시리즈B">시리즈B</Option>
            <Option value="시리즈C">시리즈C</Option>
            <Option value="시리즈D">시리즈D</Option>
            <Option value="프리A">프리A</Option>
            <Option value="프리B">프리B</Option>
            <Option value="브릿지">브릿지</Option>
            <Option value="기타">기타</Option>
          </Select>
        </Form.Item>

        <Space.Compact style={{ width: '100%' }}>
          <Form.Item
            name="amount"
            label="투자 금액 (선택사항)"
            rules={[
              { required: false, message: '투자 금액을 입력해주세요.' },
              { pattern: /^[\d,.\s]*$/, message: '숫자만 입력 가능합니다.' }
            ]}
            style={{ width: '70%' }}
          >
            <div>
              <Input 
                placeholder="투자 금액을 입력하세요 (예: 4000000)" 
                onChange={(e) => {
                  // 숫자, 쉼표, 점, 공백만 허용
                  const value = e.target.value.replace(/[^\d,.\s]/g, '');
                  form.setFieldValue('amount', value);
                  
                  // 한글 변환
                  const koreanAmount = convertNumberToKorean(value);
                  setAmountDisplay(koreanAmount);
                }}
              />
              {amountDisplay && (
                <div style={{ 
                  marginTop: '4px', 
                  fontSize: '12px', 
                  color: '#1890ff',
                  fontWeight: 'bold',
                  backgroundColor: '#f0f8ff',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #d6e4ff'
                }}>
                  {amountDisplay}원
                </div>
              )}
            </div>
          </Form.Item>
          <Form.Item
            name="currency"
            label="통화"
            style={{ width: '30%' }}
          >
            <Select>
              <Option value="KRW">KRW</Option>
              <Option value="USD">USD</Option>
              <Option value="EUR">EUR</Option>
              <Option value="JPY">JPY</Option>
            </Select>
          </Form.Item>
        </Space.Compact>

        <Form.Item
          name="sector"
          label="섹터"
          rules={[{ required: true, message: '섹터를 입력해주세요.' }]}
        >
          <Input placeholder="섹터를 입력하세요 (예: IT, 헬스케어, 핀테크)" />
        </Form.Item>

        <Form.Item
          name="investment_date"
          label="투자 날짜"
        >
          <Input type="date" />
        </Form.Item>

        <Form.Item
          name="news_summary"
          label="기사 요약 (선택사항)"
        >
          <Input.TextArea 
            placeholder="기사 내용 요약을 입력하세요" 
            rows={3}
          />
        </Form.Item>
            </Form>
          )}

          {investmentType === 'fund' && (
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                currency: 'KRW'
              }}
            >
              <Form.Item
                name="fund_name"
                label="펀드명"
                rules={[{ required: true, message: '펀드명을 입력해주세요.' }]}
              >
                <Input 
                  placeholder="펀드명을 입력하세요" 
                />
              </Form.Item>

              {/* 펀드보기 버튼 - 입력칸 아래로 이동 */}
              <Button 
                icon={<EyeOutlined />}
                onClick={async () => {
                  // 토글 기능: 이미 열려있으면 닫기
                  if (showFundList) {
                    setShowFundList(false);
                    setInvestorFunds([]);
                    return;
                  }
                  
                  const investorId = article?.search_investor_id || searchInvestorId;
                  if (!investorId) {
                    message.warning('기사에 연결된 투자사 정보가 없습니다.');
                    return;
                  }
                  setLoadingFunds(true);
                  setShowFundList(true);
                  try {
                    const response = await fundsAPI.getFunds({
                      investor_id: investorId,
                      limit: 1000
                    });
                    if (response.data && response.data.funds) {
                      setInvestorFunds(Array.isArray(response.data.funds) ? response.data.funds : []);
                    } else {
                      setInvestorFunds([]);
                    }
                  } catch (error: any) {
                    console.error('펀드 목록 조회 실패:', error);
                    message.error('펀드 목록을 불러오는데 실패했습니다.');
                    setInvestorFunds([]);
                  } finally {
                    setLoadingFunds(false);
                  }
                }}
                style={{ marginBottom: '16px' }}
              >
                {articleInvestorName ? `${articleInvestorName} 펀드보기` : '펀드보기'}
              </Button>

              {/* 펀드 목록 표시 영역 */}
              {showFundList && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '16px', 
                  border: '1px solid #d9d9d9', 
                  borderRadius: '4px',
                  backgroundColor: '#fafafa',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <Typography.Text strong>투자사 펀드 목록</Typography.Text>
                  </div>
                  <Spin spinning={loadingFunds}>
                    {investorFunds.length > 0 ? (
                      <List
                        size="small"
                        dataSource={investorFunds}
                        renderItem={(fund: any) => (
                          <List.Item
                            style={{
                              padding: '8px 12px',
                              border: '1px solid #e8e8e8',
                              borderRadius: '4px',
                              marginBottom: '8px',
                              backgroundColor: '#fff'
                            }}
                          >
                            <div style={{ width: '100%' }}>
                              <Typography.Text strong style={{ fontSize: '14px' }}>
                                {fund.fund_name}
                                {fund.article_count > 0 && <span style={{ marginLeft: '4px' }}>🗞️</span>}
                              </Typography.Text>
                              <div style={{ marginTop: '4px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {fund.fund_sectors && (
                                  <Tag color="blue" size="small">섹터: {fund.fund_sectors}</Tag>
                                )}
                                {fund.registration_date && (
                                  <Tag size="small">등록일: {new Date(fund.registration_date).toLocaleDateString('ko-KR')}</Tag>
                                )}
                              </div>
                            </div>
                          </List.Item>
                        )}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
                        {loadingFunds ? '로딩 중...' : '펀드 정보가 없습니다.'}
                      </div>
                    )}
                  </Spin>
                </div>
              )}

              <Form.Item
                name="fund_sector"
                label="투자 섹터"
                rules={[{ required: true, message: '투자 섹터를 입력해주세요.' }]}
              >
                <Input placeholder="투자 섹터를 입력하세요 (예: IT, 헬스케어, 핀테크)" />
              </Form.Item>
            </Form>
          )}

          {investmentType === 'others' && (
            <Form
              form={form}
              layout="vertical"
            >
              <Form.Item
                name="others_ac_name"
                label="AC 이름"
                rules={[{ required: true, message: 'AC 이름을 입력해주세요.' }]}
              >
                <Input placeholder="활동 주체인 AC 이름을 입력하세요" />
              </Form.Item>

              <Form.Item
                name="others_event_type"
                label="활동 종류"
                rules={[{ required: true, message: '활동 종류를 입력해주세요.' }]}
              >
                <Select placeholder="활동 종류를 선택하세요">
                  <Option value="DemoDay">DemoDay</Option>
                  <Option value="MOU">MOU</Option>
                  <Option value="파트너십">파트너십</Option>
                  <Option value="투자금 회수">투자금 회수</Option>
                  <Option value="엑싯">엑싯</Option>
                  <Option value="지분 매도">지분 매도</Option>
                  <Option value="기타">기타</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="others_related_company"
                label="협력 기업 (선택사항)"
              >
                <Input placeholder="파트너십 또는 협력 기업 이름을 입력하세요" />
              </Form.Item>

              <Form.Item
                name="others_summary"
                label="활동 내용 요약"
                rules={[{ required: true, message: '활동 내용 요약을 입력해주세요.' }]}
              >
                <Input.TextArea 
                  placeholder="활동 내용을 요약하여 입력하세요" 
                  rows={4}
                />
              </Form.Item>

              <Form.Item
                name="others_date"
                label="활동 날짜 (선택사항)"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Form>
          )}

          {investmentType === 'none' && (
            <Card 
              title="기사 처리 완료" 
              size="small"
              style={{ 
                textAlign: 'center', 
                padding: '40px 20px',
                backgroundColor: '#f5f5f5'
              }}
            >
              <div style={{ fontSize: '16px', color: '#666', marginBottom: '16px' }}>
                이 기사는 별도의 투자 정보나 펀드 정보를 입력하지 않고 처리됩니다.
              </div>
              <div style={{ fontSize: '14px', color: '#999' }}>
                기사가 시스템에 저장되어 나중에 참조할 수 있습니다.
              </div>
            </Card>
          )}
        </Col>
      </Row>

    </Modal>
  );
};

export default InvestmentInputModal;

