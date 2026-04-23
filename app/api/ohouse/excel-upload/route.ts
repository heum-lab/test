import { handleExcelUpload } from '@/lib/excel/server';
import { ohouseSchema } from '@/lib/validations/ohouse';

export async function POST(request: Request) {
  return handleExcelUpload(request, {
    moduleKey: 'ohouse',
    schema: ohouseSchema,
  });
}
