import * as React from 'react'
import { useQuery } from '@apollo/react-hooks'
import { Button, Card } from '@alifd/next'

import { send } from '../../utils/vscode'
import LoadingPage from '../LoadingPage'
import queryTutorial from './queryTutorial'
import * as T from '../../../../typings/graphql'

interface Props {
  tutorial: T.Tutorial
  onContinue(): void
}

export const ContinuePage = (props: Props) => (
  <div>
    <h3>Continue</h3>
    <Card showTitleBullet={false} contentHeight="auto">
      <div>
        <h2>{props.tutorial.title}</h2>
        <p>{props.tutorial.text}</p>
        <Button onClick={props.onContinue}>Resume</Button>
      </div>
    </Card>
  </div>
)

const Loading = () => <LoadingPage text="Loading tutorials" />

const ContinuePageContainer = () => {
  // TODO: load specific tutorialId
  const { data, loading, error } = useQuery(queryTutorial, {
    variables: {
      tutorialId: 1,
      version: '0.1.0',
    },
  })

  if (loading) {
    return Loading
  }

  if (error) {
    return (
      <div>
        <h5>{error.message}</h5>
        <p>{JSON.stringify(error, null, 2)}</p>
      </div>
    )
  }

  return (
    <ContinuePage
      tutorial={data.tutorial}
      onContinue={() => {
        send('TUTORIAL_START')
      }}
    />
  )
}

export default ContinuePageContainer
