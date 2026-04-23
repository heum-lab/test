import { handleExcelUpload } from '@/lib/excel/server';
import { autoCompleteSchema } from '@/lib/validations/auto-complete';

export async function POST(request: Request) {
  return handleExcelUpload(request, {
    moduleKey: 'auto-complete',
    schema: autoCompleteSchema,
  });
}
