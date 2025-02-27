/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { lazy, Suspense } from 'react';
import { EuiLoadingSpinner } from '@elastic/eui';
import type { CreateCaseFlyoutProps } from '../../components/create/flyout';
import { CasesProvider, CasesContextProps } from '../../components/cases_context';

type GetCreateCaseFlyoutPropsInternal = CreateCaseFlyoutProps & CasesContextProps;
export type GetCreateCaseFlyoutProps = Omit<
  GetCreateCaseFlyoutPropsInternal,
  'externalReferenceAttachmentTypeRegistry'
>;

export const CreateCaseFlyoutLazy: React.FC<CreateCaseFlyoutProps> = lazy(
  () => import('../../components/create/flyout')
);
export const getCreateCaseFlyoutLazy = ({
  externalReferenceAttachmentTypeRegistry,
  owner,
  permissions,
  features,
  afterCaseCreated,
  onClose,
  onSuccess,
  attachments,
}: GetCreateCaseFlyoutPropsInternal) => (
  <CasesProvider value={{ externalReferenceAttachmentTypeRegistry, owner, permissions, features }}>
    <Suspense fallback={<EuiLoadingSpinner />}>
      <CreateCaseFlyoutLazy
        afterCaseCreated={afterCaseCreated}
        onClose={onClose}
        onSuccess={onSuccess}
        attachments={attachments}
      />
    </Suspense>
  </CasesProvider>
);

export const getCreateCaseFlyoutLazyNoProvider = (props: CreateCaseFlyoutProps) => (
  <Suspense fallback={<EuiLoadingSpinner />}>
    <CreateCaseFlyoutLazy {...props} />
  </Suspense>
);
