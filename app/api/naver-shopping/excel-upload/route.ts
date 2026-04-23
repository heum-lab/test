import { handleExcelUpload } from '@/lib/excel/server';
import { naverShoppingSchema } from '@/lib/validations/naver-shopping';

export async function POST(request: Request) {
  return handleExcelUpload(request, {
    moduleKey: 'naver-shopping',
    schema: naverShoppingSchema,
  });
}
