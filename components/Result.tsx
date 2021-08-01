import { FunctionComponent } from "react";

interface Props {
  twiffaResult: TwiffaResult;
}

export const component: FunctionComponent<Props> = ({ twiffaResult }) => {
  // TODO
  return (
    <main className="w-screen flex flex-col items-center">
      {JSON.stringify(twiffaResult)}
    </main>
  );
};

export default component;
