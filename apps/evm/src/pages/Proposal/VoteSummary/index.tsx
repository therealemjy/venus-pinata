/** @jsxImportSource @emotion/react */
import Typography from '@mui/material/Typography';
import { BigNumber } from 'bignumber.js';
import { Card, type CardProps, InfoIcon, Username } from 'components';
import { useCallback } from 'react';

import { Button, LabeledProgressBar } from 'components';
import { routes } from 'constants/routing';
import { Link } from 'containers/Link';
import { useGetToken } from 'libs/tokens';
import { useTranslation } from 'libs/translations';
import type { VotersDetails } from 'types';
import { convertMantissaToTokens } from 'utilities';

import { useStyles } from './styles';

interface VoteSummaryProps extends CardProps {
  label: string;
  progressBarColor: string;
  votedValueMantissa?: BigNumber;
  votedTotalMantissa?: BigNumber;
  voters?: VotersDetails['result'];
  className?: string;
  votingEnabled: boolean;
  openVoteModal: () => void;
}

const VoteSummary = ({
  openVoteModal,
  label,
  progressBarColor,
  votedTotalMantissa = new BigNumber(0),
  votedValueMantissa = new BigNumber(0),
  voters = [],
  votingEnabled,
  ...otherProps
}: VoteSummaryProps) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const xvs = useGetToken({
    symbol: 'XVS',
  });

  const getVoteWeight = useCallback(
    (voteWeightWei: BigNumber) =>
      convertMantissaToTokens({
        value: voteWeightWei,
        token: xvs,
        addSymbol: false,
        returnInReadableFormat: true,
      }),
    [xvs],
  );

  return (
    <Card css={styles.root} {...otherProps}>
      <div css={styles.topSection} className="space-y-8 sm:space-y-0 xl:space-y-8">
        <div css={styles.labeledProgressBarContainer}>
          <LabeledProgressBar
            greyLeftText={label}
            whiteRightText={getVoteWeight(votedValueMantissa || new BigNumber(0))}
            value={votedValueMantissa.toNumber()}
            min={0}
            // If there are no votes set a fallback to zero the progressbar
            max={votedTotalMantissa.toNumber() || 100}
            step={1}
            ariaLabel={t('vote.summaryProgressBar', { voteType: label })}
            progressBarColor={progressBarColor}
          />
        </div>

        {votingEnabled && (
          <Button css={styles.button} onClick={openVoteModal}>
            {label}
          </Button>
        )}
      </div>

      <div css={styles.votesHeader}>
        <Typography>{t('voteSummary.addresses', { count: voters.length })}</Typography>
        <Typography>{t('voteSummary.votes')}</Typography>
      </div>

      <ul css={styles.votesWrapper}>
        {voters.map(({ address, votesMantissa, reason }) => (
          <li key={address} css={styles.voteFrom}>
            <div css={styles.address}>
              <Username className="max-w-40 sm:max-w-full" address={address}>
                {({ innerContent }) => (
                  <Link
                    to={routes.governanceVoter.path.replace(':address', address)}
                    css={[styles.blueText, styles.addressText]}
                  >
                    <div className="truncate max-w-40 sm:max-w-fit">{innerContent}</div>
                  </Link>
                )}
              </Username>

              {reason && <InfoIcon iconName="comment" tooltip={reason} />}
            </div>

            <Typography color="text.primary">
              {convertMantissaToTokens({
                value: votesMantissa,
                token: xvs,
                addSymbol: false,
                returnInReadableFormat: true,
              })}
            </Typography>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default VoteSummary;
