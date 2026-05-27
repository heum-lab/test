'use client';

import { useEffect } from 'react';
import { useSession } from '@/lib/auth/session-context';
import { useAgencyOptions } from '@/hooks/useOptions';

/**
 * 필터의 총판 셀렉트를 로그인 역할에 맞게 스코프한다.
 *  - super_admin : 모든 총판 선택 가능 (restricted=false)
 *  - agency(총판) / seller(대행사) : 선택 가능한 총판이 1개뿐(본인 / 상위 총판)이므로
 *    해당 총판을 자동 선택하고 셀렉트를 잠근다 (restricted=true).
 *
 * 옵션 목록(useAgencyOptions)은 이미 서버(/api/options/agencies)에서 역할별로 스코프된다.
 */
export function useScopedAgencyFilter<T extends { agency_id: string; seller_id: string }>(
  value: T,
  onChange: (next: T) => void,
) {
  const session = useSession();
  const { data: agencies = [] } = useAgencyOptions();
  const restricted = session.role !== 'super_admin';

  useEffect(() => {
    if (restricted && agencies.length > 0 && value.agency_id === 'all') {
      onChange({ ...value, agency_id: String(agencies[0].id), seller_id: 'all' });
    }
    // value/onChange 는 매 렌더 새 참조이므로 의존성에서 제외한다.
    // value.agency_id 가 'all' 일 때만 1회 실행되므로 무한 루프는 발생하지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restricted, agencies, value.agency_id]);

  return { agencies, restricted };
}
