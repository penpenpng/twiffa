import { FunctionComponent } from "react";

export const component: FunctionComponent = () => {
  return (
    <footer className="w-screen flex flex-col items-center text-sm text-gray-400 mt-8">
      <hr className="w-9/12" />
      <p className="mt-2">
        Contact: <a href="https://twitter.com/penpen_png">@penpen_png</a>
      </p>
      <p className="mt-1">
        GitHub: <a href="https://github.com/penpenpng/twiffa">twiffa</a>
      </p>
      <p className="mt-1">© 2021 penpenpng</p>
    </footer>
  );
};

export default component;
