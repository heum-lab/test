import { handleExcelUpload } from '@/lib/excel/server';
import { kakaoMapSchema } from '@/lib/validations/kakao-map';

export async function POST(request: Request) {
  return handleExcelUpload(request, {
    moduleKey: 'kakao-map',
    schema: kakaoMapSchema,
  });
}
