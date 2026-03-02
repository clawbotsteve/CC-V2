-- AlterEnum: Add veo_4s and veo_8s to VideoVariant enum
DO $$ 
BEGIN
    -- Add veo_4s if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'veo_4s' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'VideoVariant')
    ) THEN
        ALTER TYPE "VideoVariant" ADD VALUE 'veo_4s';
    END IF;

    -- Add veo_8s if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'veo_8s' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'VideoVariant')
    ) THEN
        ALTER TYPE "VideoVariant" ADD VALUE 'veo_8s';
    END IF;
END $$;

