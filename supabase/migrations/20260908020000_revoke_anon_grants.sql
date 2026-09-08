-- Defesa em profundidade: hoje a RLS ja barra o anonimo nestas tabelas, porque
-- nenhuma policy cobre esse papel. Mas o GRANT de tabela continuava de pe, entao
-- bastaria alguem criar uma policy permissiva (TO public, ou USING (true)) para
-- o anonimo passar a ler tudo. Sem o GRANT, o acesso morre uma camada antes.

REVOKE ALL ON TABLE public."Atletas"   FROM anon;
REVOKE ALL ON TABLE public.profiles    FROM anon;
REVOKE ALL ON TABLE public.user_roles  FROM anon;
