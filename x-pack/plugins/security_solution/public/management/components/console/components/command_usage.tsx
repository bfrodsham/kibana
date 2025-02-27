/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { memo, useMemo } from 'react';
import { EuiDescriptionList, EuiPanel, EuiSpacer, EuiText } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { ConsoleCodeBlock } from './console_code_block';
import { getArgumentsForCommand } from '../service/parsed_command_input';
import type { CommandDefinition } from '../types';
import { useTestIdGenerator } from '../../../hooks/use_test_id_generator';
import { useDataTestSubj } from '../hooks/state_selectors/use_data_test_subj';

const additionalProps = {
  className: 'euiTruncateText',
};

export const CommandInputUsage = memo<Pick<CommandUsageProps, 'commandDef'>>(({ commandDef }) => {
  const usageHelp = useMemo(() => {
    return getArgumentsForCommand(commandDef).map((usage) => {
      return (
        <EuiText size="s">
          <ConsoleCodeBlock>{`${commandDef.name} ${usage}`}</ConsoleCodeBlock>
        </EuiText>
      );
    });
  }, [commandDef]);

  return (
    <>
      <EuiDescriptionList
        compressed
        type="column"
        className="descriptionList-20_80"
        listItems={[
          {
            title: (
              <ConsoleCodeBlock>
                {i18n.translate('xpack.securitySolution.console.commandUsage.inputUsage', {
                  defaultMessage: 'Usage',
                })}
              </ConsoleCodeBlock>
            ),
            description: usageHelp,
          },
        ]}
        descriptionProps={additionalProps}
        titleProps={additionalProps}
      />
      <EuiSpacer size="s" />
      {commandDef.exampleUsage && (
        <EuiDescriptionList
          compressed
          type="column"
          className="descriptionList-20_80"
          listItems={[
            {
              title: (
                <ConsoleCodeBlock>
                  {i18n.translate('xpack.securitySolution.console.commandUsage.exampleUsage', {
                    defaultMessage: 'Example',
                  })}
                </ConsoleCodeBlock>
              ),
              description: <ConsoleCodeBlock>{commandDef.exampleUsage}</ConsoleCodeBlock>,
            },
          ]}
          descriptionProps={additionalProps}
          titleProps={additionalProps}
        />
      )}
    </>
  );
});
CommandInputUsage.displayName = 'CommandInputUsage';

export interface CommandUsageProps {
  commandDef: CommandDefinition;
}

export const CommandUsage = memo<CommandUsageProps>(({ commandDef }) => {
  const getTestId = useTestIdGenerator(useDataTestSubj());
  const hasArgs = useMemo(() => Object.keys(commandDef.args ?? []).length > 0, [commandDef.args]);

  type CommandDetails = Array<{
    title: string;
    description: string;
  }>;

  const commandOptions = useMemo(() => {
    if (!hasArgs || !commandDef.args) {
      return {
        required: [],
        exclusiveOr: [],
        optional: [],
      };
    }

    const enteredCommands = Object.entries(commandDef.args).reduce<{
      required: CommandDetails;
      exclusiveOr: CommandDetails;
      optional: CommandDetails;
    }>(
      (acc, curr) => {
        const item = {
          title: `--${curr[0]}`,
          description: curr[1].about,
        };
        if (curr[1].required) {
          acc.required.push(item);
        } else if (curr[1].exclusiveOr) {
          acc.exclusiveOr.push(item);
        } else {
          acc.optional.push(item);
        }

        return acc;
      },
      {
        required: [],
        exclusiveOr: [],
        optional: [],
      }
    );
    return enteredCommands;
  }, [commandDef.args, hasArgs]);

  const parametersDescriptionList = (title: string, parameters: CommandDetails) => {
    const description = parameters.map((item) => (
      <div>
        <ConsoleCodeBlock bold inline>
          {item.title}
        </ConsoleCodeBlock>
        <ConsoleCodeBlock inline>{` - ${item.description}`}</ConsoleCodeBlock>
      </div>
    ));
    return (
      <>
        <EuiSpacer />
        {commandDef.args && (
          <EuiDescriptionList
            compressed
            type="column"
            className="descriptionList-20_80"
            listItems={[{ title: <ConsoleCodeBlock>{title}</ConsoleCodeBlock>, description }]}
            descriptionProps={additionalProps}
            titleProps={additionalProps}
            data-test-subj={getTestId('commandUsage-options')}
          />
        )}
      </>
    );
  };

  return (
    <EuiPanel paddingSize="none" color="transparent" data-test-subj={getTestId('commandUsage')}>
      <EuiDescriptionList
        compressed
        type="column"
        className="descriptionList-20_80"
        listItems={[
          {
            title: (
              <ConsoleCodeBlock>
                {i18n.translate('xpack.securitySolution.console.commandUsage.about', {
                  defaultMessage: 'About',
                })}
              </ConsoleCodeBlock>
            ),
            description: <ConsoleCodeBlock>{commandDef.about}</ConsoleCodeBlock>,
          },
        ]}
        descriptionProps={additionalProps}
        titleProps={additionalProps}
        data-test-subj={getTestId('commandUsage-options')}
      />
      <EuiSpacer size="s" />
      <CommandInputUsage commandDef={commandDef} />
      {commandOptions.required &&
        commandOptions.required.length > 0 &&
        parametersDescriptionList(
          i18n.translate('xpack.securitySolution.console.commandUsage.requiredLabel', {
            defaultMessage: 'Required parameters',
          }),
          commandOptions.required
        )}
      {commandOptions.exclusiveOr &&
        commandOptions.exclusiveOr.length > 0 &&
        parametersDescriptionList(
          i18n.translate('xpack.securitySolution.console.commandUsage.exclusiveOr', {
            defaultMessage: 'Include only one parameter',
          }),
          commandOptions.exclusiveOr
        )}
      {commandOptions.optional &&
        commandOptions.optional.length > 0 &&
        parametersDescriptionList(
          i18n.translate('xpack.securitySolution.console.commandUsage.optional', {
            defaultMessage: 'Optional parameters',
          }),
          commandOptions.optional
        )}
    </EuiPanel>
  );
});
CommandUsage.displayName = 'CommandUsage';
