import { handleExcelUpload } from '@/lib/excel/server';
import { blogSchema } from '@/lib/validations/blog';

export async function POST(request: Request) {
  return handleExcelUpload(request, {
    moduleKey: 'blog',
    schema: blogSchema,
  });
}
