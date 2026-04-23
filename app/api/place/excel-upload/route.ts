import { handleExcelUpload } from '@/lib/excel/server';
import { placeSchema } from '@/lib/validations/place';

export async function POST(request: Request) {
  return handleExcelUpload(request, {
    moduleKey: 'place',
    schema: placeSchema,
  });
}
