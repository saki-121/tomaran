-- ============================================================
-- MIGRATION 008: profiles 自動生成 + mark_user_as_paid RPC
-- ============================================================

-- 1. 新規ユーザー登録時に profiles 行を自動生成するトリガー
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, is_paid, created_at)
  VALUES (NEW.id, false, NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profiles ON auth.users;

CREATE TRIGGER on_auth_user_created_profiles
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_profile();

-- 2. 既存ユーザーへのバックフィル（profiles 行がない全ユーザーに作成）
INSERT INTO public.profiles (id, is_paid, created_at)
SELECT id, false, NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS: ユーザーが自分の profile を読めるようにする
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can view own profile" ON public.profiles;
CREATE POLICY "users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- 4. SECURITY DEFINER 関数: Stripe 決済確認後にサーバー側から呼ぶ
--    auth.uid() チェックで「自分自身のみ更新可能」を強制
CREATE OR REPLACE FUNCTION public.mark_user_as_paid(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM target_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.profiles
  SET is_paid = true
  WHERE id = target_user_id;
END;
$$;
