import { useState } from 'react';
import styled from '@emotion/styled';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Text from '@commercetools-uikit/text';
import Spacings from '@commercetools-uikit/spacings';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import DataTable from '@commercetools-uikit/data-table';

import TextContainer from '@commercetools-uikit/text';

interface SyncError {
  id: string;
  message: string;
  timestamp: string;
}

interface ErrorListProps {
  errors: SyncError[];
}

const ErrorContainer = styled.div`
  background-color: var(--color-neutral-95);
  border: 1px solid var(--color-neutral-90);
  border-radius: 6px;
`;

const ErrorItem = styled.div`
  padding: 12px;
  &:not(:last-child) {
    border-bottom: 1px solid var(--color-neutral-90);
  }
`;

const FilterBar = styled.div`
  padding: 12px;
  background-color: var(--color-neutral-98);
  border-bottom: 1px solid var(--color-neutral-90);
  border-radius: 6px 6px 0 0;
`;

const ITEMS_PER_PAGE = 5;

export default function ErrorList({ errors }: ErrorListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(errors.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedErrors = errors.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <ErrorContainer>
      <FilterBar>
        <Spacings.Stack scale="s">
          <Spacings.Inline alignItems="center" justifyContent="space-between">
            <Text.Subheadline as="h4">
              Errors ({errors.length})
            </Text.Subheadline>
          </Spacings.Inline>
        </Spacings.Stack>
      </FilterBar>

      {
        <>
          {paginatedErrors.map((error) => (
            <ErrorItem key={error.id}>
              <Spacings.Stack scale="xs">
                <DataTable
                  columns={[
                    { key: 'date', label: 'Date' },
                    { key: 'productId', label: 'Product ID' },
                    { key: 'error', label: 'Error Message' },
                  ]}
                  itemRenderer={(item, column) => (
                    <div style={{ padding: '8px 0' }}>
                      <TextContainer.Body>
                        {item[column.key as keyof typeof item]}
                      </TextContainer.Body>
                    </div>
                  )}
                  rows={errors.map((error) => ({
                    id: error.id,
                    date: error.timestamp,
                    productId: error.id,
                    error: error.message,
                  }))}
                />
              </Spacings.Stack>
            </ErrorItem>
          ))}

          {totalPages > 1 && (
            <Spacings.Inline
              scale="s"
              alignItems="center"
              justifyContent="center"
            >
              <SecondaryButton
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                isDisabled={currentPage === 1}
                iconLeft={<ChevronLeft size={16} />}
                label="Previous"
              />
              <Text.Detail>
                Page {currentPage} of {totalPages}
              </Text.Detail>
              <SecondaryButton
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                isDisabled={currentPage === totalPages}
                iconRight={<ChevronRight size={16} />}
                label="Next"
              />
            </Spacings.Inline>
          )}
        </>
      }
    </ErrorContainer>
  );
}
