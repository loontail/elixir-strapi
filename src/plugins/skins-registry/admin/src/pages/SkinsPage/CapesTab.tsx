import { memo } from 'react';
import { Box, Typography, Flex, SearchForm, Searchbar } from '@strapi/design-system';
import { Images } from '@strapi/icons';
import { useTranslate } from '../../hooks/useTranslate';
import SkinCard from './SkinCard';
import Paginator from './Paginator';
import type { PlayerCape } from '../../../../shared/types/entities';

interface CapesTabProps {
  capes: PlayerCape[];
  total: number;
  page: number;
  pageCount: number;
  loading: boolean;
  search: string;
  serverUrl: string;
  missingIds?: Set<number>;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  onSearchSubmit: () => void;
  onPageChange: (pageNumber: number) => void;
  onDeleted: (id: number) => void;
  onDelete: (id: number) => Promise<void>;
}

const CapesTab = memo(
  function CapesTab({
    capes,
    total,
    page,
    pageCount,
    loading,
    search,
    serverUrl,
    missingIds,
    onSearchChange,
    onSearchClear,
    onSearchSubmit,
    onPageChange,
    onDeleted,
    onDelete,
  }: CapesTabProps) {
    const translate = useTranslate();

    return (
      <Box
        style={{
          padding: '28px 56px 48px',
          minHeight: 'calc(100vh - 160px)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {(search !== '' || total > 0) && (
          <Box paddingBottom={5} style={{ maxWidth: 440 }}>
            <SearchForm>
              <Searchbar
                name="cape-search"
                placeholder={translate('search.placeholder')}
                value={search}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  onSearchChange(event.target.value)
                }
                clearLabel={translate('search.clear.capes')}
                onClear={onSearchClear}
                onSubmit={onSearchSubmit}
              >
                {translate('search.label.capes')}
              </Searchbar>
            </SearchForm>
          </Box>
        )}

        {loading ? (
          <Flex alignItems="center" justifyContent="center" style={{ flex: 1 }}>
            <Typography textColor="neutral500">{translate('state.loading')}</Typography>
          </Flex>
        ) : capes.length === 0 ? (
          <Flex
            alignItems="center"
            justifyContent="center"
            direction="column"
            gap={3}
            style={{ flex: 1 }}
          >
            <Box style={{ color: 'var(--strapi-neutral-400)', lineHeight: 0 }}>
              <Images width={48} height={48} />
            </Box>
            <Typography textColor="neutral400">{translate('empty.capes')}</Typography>
          </Flex>
        ) : (
          <>
            <Box
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 16,
              }}
            >
              {capes.map((cape) => (
                <Box key={cape.id}>
                  <SkinCard
                    entry={cape}
                    type="cape"
                    serverUrl={serverUrl}
                    isMissing={missingIds?.has(cape.id)}
                    onDeleted={onDeleted}
                    onDelete={onDelete}
                  />
                </Box>
              ))}
            </Box>
            <Paginator page={page} pageCount={pageCount} onPageChange={onPageChange} />
          </>
        )}
      </Box>
    );
  },
);

export default CapesTab;
