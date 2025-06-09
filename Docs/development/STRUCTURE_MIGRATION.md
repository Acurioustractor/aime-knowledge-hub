# 🗂️ Folder Structure Migration Plan

## Current Problems
- 15+ loose files in root directory
- Development scripts mixed with production code
- Duplicate component directories
- No clear separation of concerns

## Proposed Clean Structure

```
/
├── app/                          # Next.js App Router (KEEP)
│   ├── (routes)/                 # Route groups
│   ├── api/                      # API routes (KEEP)
│   ├── components/               # App-specific components (KEEP)
│   │   ├── ui/                   # Reusable UI components
│   │   ├── forms/                # Form components
│   │   ├── data/                 # Data display components
│   │   └── layout/               # Layout components
│   ├── hooks/                    # React hooks
│   ├── types/                    # TypeScript types
│   └── utils/                    # App utilities
│
├── lib/                          # Shared utilities (KEEP)
│   ├── cache.ts                  # Caching utilities
│   ├── airtable.ts              # Airtable client
│   ├── supabase.ts              # Supabase client
│   ├── validators.ts            # Data validation
│   └── constants.ts             # App constants
│
├── database/                     # Database related (REORGANIZE)
│   ├── migrations/               # Database migrations
│   ├── schemas/                  # Schema definitions
│   └── seed/                     # Seed data
│
├── scripts/                      # Development & maintenance scripts (NEW)
│   ├── indexer/                  # Document indexing scripts
│   │   ├── core/                 # Core indexing logic
│   │   ├── processors/           # Document processors
│   │   ├── monitors/             # Monitoring scripts
│   │   └── utils/                # Indexer utilities
│   ├── debug/                    # Debug scripts
│   ├── migration/                # Data migration scripts
│   └── maintenance/              # Maintenance scripts
│
├── docs/                         # Documentation (REORGANIZE)
│   ├── api/                      # API documentation
│   ├── deployment/               # Deployment guides
│   ├── development/              # Development guides
│   └── architecture/             # Architecture docs
│
├── public/                       # Static assets (CREATE IF NEEDED)
│
├── .env.example                  # Environment template (KEEP)
├── package.json                  # Dependencies (KEEP)
├── next.config.js               # Next.js config (KEEP)
├── tailwind.config.js           # Tailwind config (KEEP)
├── tsconfig.json                # TypeScript config (KEEP)
├── README.md                    # Main documentation (KEEP)
└── .gitignore                   # Git ignore (KEEP)
```

## Migration Steps

### Phase 1: Create New Structure
1. Create new directories
2. Move development scripts to `/scripts/`
3. Consolidate documentation to `/docs/`
4. Organize database files

### Phase 2: Clean App Structure
1. Consolidate components (merge `/components/` into `/app/components/`)
2. Create proper subdirectories in `/app/components/`
3. Add `/app/hooks/`, `/app/types/`, `/app/utils/`

### Phase 3: Extract Shared Libraries
1. Create proper `/lib/` modules
2. Move reusable code to `/lib/`
3. Update imports across the app

### Phase 4: Clean Root Directory
1. Remove all loose scripts from root
2. Move everything to appropriate subdirectories
3. Keep only essential config files in root

## Benefits
- ✅ Clear separation of concerns
- ✅ Easy to find any file
- ✅ Scalable structure
- ✅ Development vs Production separation
- ✅ Following Next.js best practices
- ✅ Better maintainability 