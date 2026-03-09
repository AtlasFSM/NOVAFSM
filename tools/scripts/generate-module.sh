#!/bin/bash
# Generate a new NestJS feature module scaffold for NoVaFSM
# Usage: ./tools/scripts/generate-module.sh <module-name>
# Example: ./tools/scripts/generate-module.sh notifications

set -e

MODULE_NAME="${1}"
if [ -z "$MODULE_NAME" ]; then
  echo "Usage: $0 <module-name>"
  exit 1
fi

MODULE_DIR="backend/src/${MODULE_NAME}"

echo "Generating module: ${MODULE_NAME} at ${MODULE_DIR}"

mkdir -p "${MODULE_DIR}/dto"

# Module file
cat > "${MODULE_DIR}/${MODULE_NAME}.module.ts" << EOF
import { Module } from '@nestjs/common';
import { ${MODULE_NAME^}Controller } from './${MODULE_NAME}.controller';
import { ${MODULE_NAME^}Service } from './${MODULE_NAME}.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [${MODULE_NAME^}Controller],
  providers: [${MODULE_NAME^}Service],
  exports: [${MODULE_NAME^}Service],
})
export class ${MODULE_NAME^}Module {}
EOF

# Service file
cat > "${MODULE_DIR}/${MODULE_NAME}.service.ts" << EOF
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ${MODULE_NAME^}Service {
  constructor(private readonly prisma: PrismaService) {}
}
EOF

# Controller file
cat > "${MODULE_DIR}/${MODULE_NAME}.controller.ts" << EOF
import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ${MODULE_NAME^}Service } from './${MODULE_NAME}.service';

@Controller('${MODULE_NAME}')
@UseGuards(JwtAuthGuard)
export class ${MODULE_NAME^}Controller {
  constructor(private readonly ${MODULE_NAME}Service: ${MODULE_NAME^}Service) {}
}
EOF

echo "Module scaffold created at ${MODULE_DIR}"
echo "Next steps:"
echo "  1. Add your Prisma model to backend/prisma/schema.prisma"
echo "  2. Import ${MODULE_NAME^}Module in backend/src/app.module.ts"
echo "  3. Run: cd backend && npx prisma migrate dev --name add-${MODULE_NAME}"
