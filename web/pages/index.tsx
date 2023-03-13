import Button from "@/components/Button/Button";
import { RadioGroup, Switch } from "@headlessui/react";
import { useState } from "react";

export default function Home() {
  let [plan, setPlan] = useState('startup')

  return (
    <div>
      <Button> hello </Button>
      <RadioGroup value={plan} onChange={setPlan}>
        <RadioGroup.Label>Plan</RadioGroup.Label>
        <RadioGroup.Option value="startup">
          {({ checked }) => (
            <span className={ checked ? 'ring' : '' }>Startup</span>
            )
          }
        </RadioGroup.Option>
        <RadioGroup.Option value="bbb">
          {({ checked }) => (
            <span className={ checked ? 'ring' : '' }>Startup</span>
            )
          }
        </RadioGroup.Option>
      </RadioGroup>
      <Switch>
        aaaa
      </Switch>
    </div>
  )
}
