package common

type PreConfigLoadCallback func()
type PostConfigLoadCallback func(cfg *ChocolateConfig)

var (
	preConfigLoadHooks  []PreConfigLoadCallback  = make([]PreConfigLoadCallback, 0)
	postConfigLoadHooks []PostConfigLoadCallback = make([]PostConfigLoadCallback, 0)
)

func HookPreConfigLoad(cb func()) {
	preConfigLoadHooks = append(preConfigLoadHooks, cb)
}

func HookPostConfigLoad(cb func(cfg *ChocolateConfig)) {
	postConfigLoadHooks = append(postConfigLoadHooks, cb)
}

func invokePreConfigHooks() {
	for _, f := range preConfigLoadHooks {
		f()
	}
}

func invokePostConfigHooks() {
	for _, f := range postConfigLoadHooks {
		f(&Config)
	}
}
