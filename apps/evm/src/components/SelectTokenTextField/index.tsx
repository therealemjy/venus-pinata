/** @jsxImportSource @emotion/react */
import { Typography } from '@mui/material';
import { useState } from 'react';

import { TokenIconWithSymbol } from 'components/TokenIconWithSymbol';
import type { Token, TokenBalance } from 'types';

import { TertiaryButton } from '@venusprotocol/ui';
import { Icon } from '../Icon';
import { TokenTextField, type TokenTextFieldProps } from '../TokenTextField';
import TokenList from './TokenList';
import { useStyles } from './styles';
import {
  getTokenMaxButtonTestId,
  getTokenSelectButtonTestId,
  getTokenTextFieldTestId,
} from './testIdGetters';

export interface SelectTokenTextFieldProps extends Omit<TokenTextFieldProps, 'max' | 'token'> {
  selectedToken: Token;
  tokenBalances: TokenBalance[];
  onChangeSelectedToken: (token: Token) => void;
  'data-testid'?: string;
}

export const SelectTokenTextField: React.FC<SelectTokenTextFieldProps> = ({
  selectedToken,
  disabled,
  tokenBalances,
  onChange,
  onChangeSelectedToken,
  className,
  value,
  rightMaxButton,
  'data-testid': testId,
  description,
  ...otherTokenTextFieldProps
}) => {
  const styles = useStyles();
  const [isTokenListShown, setIsTokenListShown] = useState(false);

  const handleButtonClick = () => setIsTokenListShown(isShowing => !isShowing);

  const handleChangeSelectedToken = (newSelectedToken: Token) => {
    setIsTokenListShown(false);
    onChangeSelectedToken(newSelectedToken);
  };

  return (
    <div className={className} data-testid={testId}>
      <TokenTextField
        token={selectedToken}
        disabled={disabled}
        displayTokenIcon={false}
        value={value}
        onChange={onChange}
        rightAdornment={
          <>
            <TertiaryButton
              onClick={handleButtonClick}
              css={styles.getButton({ isTokenListShown })}
              className="p-2"
              disabled={disabled}
              data-testid={!!testId && getTokenSelectButtonTestId({ parentTestId: testId })}
            >
              <TokenIconWithSymbol token={selectedToken} css={styles.token} />

              <Icon
                css={styles.getArrowIcon({ isTokenListShown })}
                name="arrowUp"
                className="w-5 h-5"
              />
            </TertiaryButton>

            {rightMaxButton && (
              <TertiaryButton
                disabled={disabled}
                css={styles.maxButton}
                data-testid={!!testId && getTokenMaxButtonTestId({ parentTestId: testId })}
                {...rightMaxButton}
              >
                {rightMaxButton.label}
              </TertiaryButton>
            )}
          </>
        }
        data-testid={!!testId && getTokenTextFieldTestId({ parentTestId: testId })}
        {...otherTokenTextFieldProps}
      />

      <div css={styles.tokenListContainer}>
        {isTokenListShown && (
          <TokenList
            tokenBalances={tokenBalances}
            data-testid={testId}
            onTokenClick={handleChangeSelectedToken}
          />
        )}
      </div>

      <Typography variant="small2" css={styles.description}>
        {description}
      </Typography>

      <div
        css={styles.getBackdrop({ isTokenListShown })}
        onClick={() => setIsTokenListShown(false)}
      />
    </div>
  );
};
