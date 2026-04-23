import { handleExcelUpload } from '@/lib/excel/server';
import { trafficSchema } from '@/lib/validations/traffic';

export async function POST(request: Request) {
  return handleExcelUpload(request, {
    moduleKey: 'traffic',
    schema: trafficSchema,
  });
}
